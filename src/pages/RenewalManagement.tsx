import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, RenewalRecord } from '../contexts/appContext';
import { toast } from 'sonner';
import { formatDate, exportToCSV } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function RenewalManagement() {
  const { data, saveData } = useContext(AppContext);
  const [courses, setCourses] = useState(data.courses);
  const [filteredCourses, setFilteredCourses] = useState(data.courses);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [renewalData, setRenewalData] = useState<RenewalRecord>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 加载数据
  useEffect(() => {
    setCourses(data.courses);
    setRenewalData(data.renewals);filterCourses();
  }, [data.courses, data.renewals, searchQuery, statusFilter]);

  // 筛选课程
  const filterCourses = () => {
    let result = [...courses];
    
    if (searchQuery) {
      result = result.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter === 'active') {
      result = result.filter(course => !course.isCompleted);
    } else if (statusFilter === 'completed') {
      result = result.filter(course => course.isCompleted);
    }
    
    setFilteredCourses(result);
  };

  // 获取学生姓名
  const getStudentName = (id: string): string => {
    return data.students.find(student => student.id === id)?.name || id;
  };

  // 获取续费状态
  const getRenewalStatus = (courseId: string, studentId: string): 'renewed' | 'not-renewed' | 'pending' => {
    return renewalData[courseId]?.[studentId]?.status || 'not-renewed';
  };

  // 获取续费备注
  const getRenewalRemark = (courseId: string, studentId: string): string => {
    return renewalData[courseId]?.[studentId]?.remark || '';
  };

  // 更新续费状态
  const updateRenewalStatus = (courseId: string, studentId: string, status: 'renewed' | 'not-renewed' | 'pending') => {
    const updatedRenewals = { ...renewalData };
    
    if (!updatedRenewals[courseId]) {
      updatedRenewals[courseId] = {};
    }
    
    if (!updatedRenewals[courseId][studentId]) {
      updatedRenewals[courseId][studentId] = { status: 'not-renewed', remark: '' };
    }
    
    updatedRenewals[courseId][studentId].status = status;
    setRenewalData(updatedRenewals);
    saveData({ renewals: updatedRenewals });
  };

  // 更新续费备注
  const updateRenewalRemark = (courseId: string, studentId: string, remark: string) => {
    const updatedRenewals = { ...renewalData };
    
    if (!updatedRenewals[courseId]) {
      updatedRenewals[courseId] = {};
    }
    
    if (!updatedRenewals[courseId][studentId]) {
      updatedRenewals[courseId][studentId] = { status: 'not-renewed', remark: '' };
    }
    
    updatedRenewals[courseId][studentId].remark = remark;
    setRenewalData(updatedRenewals);
    saveData({ renewals: updatedRenewals });
  };

  // 导出续费表
  const handleExportRenewals = () => {
    if (!selectedCourseId) return;
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;
    
    const exportData = course.enrolledStudents.map(studentId => {
      const status = getRenewalStatus(selectedCourseId!, studentId);
      const statusText = status === 'renewed' ? '已续费' : status === 'not-renewed' ? '未续费' : '待确认';
      
      return {
        '学生姓名': getStudentName(studentId),
        '续费状态': statusText,
        '续费备注': getRenewalRemark(selectedCourseId!, studentId)
      };
    });
    
    exportToCSV(exportData, `续费表_${course.name}_${formatDate(new Date())}.csv`);
    toast.success('续费表导出成功');
  };

  // 获取状态对应的样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'renewed':
        return 'bg-green-100 text-green-800';
      case 'not-renewed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // 获取状态对应的文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'renewed':
        return '已续费';
      case 'not-renewed':
        return '未续费';
      case 'pending':
        return '待确认';
      default:
        return '未知';
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">续费管理</h1>
        <p className="text-slate-600">管理学生续费情况</p>
      </div>

      {/* 筛选和操作栏 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex w-full flex-wrap gap-4 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜索课程名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有课程</option>
            <option value="active">未结课</option>
            <option value="completed">已结课</option>
          </select>
        </div>
        
        {selectedCourseId && (
          <button
            onClick={handleExportRenewals}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-download mr-2"></i>
            导出续费表
          </button>
        )}
      </div>

      {/* 课程列表和续费详情 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-md">
        {filteredCourses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">课程名称</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">课程类型</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">课时总数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">学生人数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCourses.map((course) => (
                  <>
                    <motion.tr 
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedCourseId === course.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedCourseId(course.id === selectedCourseId ? null : course.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800">{course.name}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        {course.type === 'spring' ? '春季' :
                         course.type === 'autumn' ? '秋季' :
                         course.type === 'winter' ? '寒假' : '暑假'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">{course.totalLessons}次</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">{course.enrolledStudents.length}人</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          course.isCompleted 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {course.isCompleted ? '已结课' : '进行中'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                        <i className={`fa-solid transition-transform ${
                          selectedCourseId === course.id ? 'fa-chevron-down' : 'fa-chevron-right'
                        }`}></i>
                      </td>
                    </motion.tr>
                    
                    {/* 续费详情 */}
                    {selectedCourseId === course.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={6} className="p-0">
                          <div className="border-t border-slate-200 bg-white p-4">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-slate-800">续费详情</h3>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">学生姓名</th>
                                    <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">续费状态</th>
                                    <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">续费备注</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {course.enrolledStudents.map((studentId) => {
                                    const status = getRenewalStatus(course.id, studentId);
                                    const remark = getRenewalRemark(course.id, studentId);
                                    
                                    return (
                                      <tr key={studentId}>
                                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-800">
                                          {getStudentName(studentId)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-center">
                                          <select
                                            value={status}
                                            onChange={(e) => updateRenewalStatus(
                                              course.id, 
                                              studentId, 
                                              e.target.value as 'renewed' | 'not-renewed' | 'pending'
                                            )}
                                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                          >
                                            <option value="not-renewed">未续费</option>
                                            <option value="renewed">已续费</option>
                                            <option value="pending">待确认</option>
                                          </select>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                          <input
                                            type="text"
                                            value={remark}
                                            onChange={(e) => updateRenewalRemark(course.id, studentId, e.target.value)}
                                            placeholder="添加备注..."
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* 续费统计 */}
                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <h4 className="mb-2 text-sm font-medium text-slate-700">续费统计</h4>
                              <div className="grid gap-2 sm:grid-cols-3">
                                {selectedCourseId && (
                                  <>
                                    <div className="flex items-center text-sm">
                                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">已续费</span>
                                      <span className="ml-2 text-slate-700">
                                        {course.enrolledStudents.filter(s => getRenewalStatus(selectedCourseId!, s) === 'renewed').length}人
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">未续费</span>
                                      <span className="ml-2 text-slate-700">
                                        {course.enrolledStudents.filter(s => getRenewalStatus(selectedCourseId!, s) === 'not-renewed').length}人
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">待确认</span>
                                      <span className="ml-2 text-slate-700">
                                        {course.enrolledStudents.filter(s => getRenewalStatus(selectedCourseId!, s) === 'pending').length}人
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="暂无课程数据" />
        )}
      </div>
    </div>
  );
}