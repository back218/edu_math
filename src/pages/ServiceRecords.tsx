import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, ServiceRecord } from '../contexts/appContext';
import { toast } from 'sonner';
import { formatDate, exportToCSV } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function ServiceRecords() {
  const { data, saveData } = useContext(AppContext);
  const [courses, setCourses] = useState(data.courses);
  const [filteredCourses, setFilteredCourses] = useState(data.courses);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [serviceRecordData, setServiceRecordData] = useState<ServiceRecord>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingCell, setEditingCell] = useState<{courseId: string, studentId: string, lessonIndex: number} | null>(null);
  const [editValue, setEditValue] = useState('');

  // 加载数据
  useEffect(() => {
    setCourses(data.courses);
    setServiceRecordData(data.serviceRecords);
    filterCourses();
  }, [data.courses, data.serviceRecords, searchQuery, statusFilter]);

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

  // 格式化课次标题
  const formatLessonTitle = (courseId: string, lessonIndex: number): string => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.schedule[lessonIndex]) return `第${lessonIndex + 1}次课`;
    
    const date = new Date(course.schedule[lessonIndex]);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `第${lessonIndex + 1}次课（${month}月${day}日）`;
  };

  // 获取服务记录
  const getServiceRecord = (courseId: string, studentId: string, lessonIndex: number): string => {
    return serviceRecordData[courseId]?.[studentId]?.[lessonIndex.toString()] || '';
  };

  // 开始编辑服务记录
  const startEditing = (courseId: string, studentId: string, lessonIndex: number) => {
    const value = getServiceRecord(courseId, studentId, lessonIndex);
    setEditingCell({ courseId, studentId, lessonIndex });
    setEditValue(value);
  };

  // 保存服务记录
  const saveServiceRecord = () => {
    if (!editingCell) return;
    
    const { courseId, studentId, lessonIndex } = editingCell;
    const updatedRecords = { ...serviceRecordData };
    
    if (!updatedRecords[courseId]) {
      updatedRecords[courseId] = {};
    }
    
    if (!updatedRecords[courseId][studentId]) {
      updatedRecords[courseId][studentId] = {};
    }
    
    updatedRecords[courseId][studentId][lessonIndex.toString()] = editValue;
    setServiceRecordData(updatedRecords);
    saveData({ serviceRecords: updatedRecords });
    
    setEditingCell(null);
    setEditValue('');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // 导出服务记录表
  const handleExportServiceRecords = () => {
    if (!selectedCourseId) return;
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;
    
    const exportData = course.enrolledStudents.map(studentId => {
      const row: any = {
        '学生姓名': getStudentName(studentId)
      };
      
      course.schedule.forEach((date, index) => {
        const record = getServiceRecord(selectedCourseId!, studentId, index);
        row[`第${index + 1}次课（${date}）`] = record || '';
      });
      
      return row;
    });
    
    exportToCSV(exportData, `服务记录表_${course.name}_${formatDate(new Date())}.csv`);
    toast.success('服务记录表导出成功');
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">学生服务记录</h1>
        <p className="text-slate-600">记录学生服务情况</p>
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
            onClick={handleExportServiceRecords}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-download mr-2"></i>
            导出服务记录表
          </button>
        )}
      </div>

      {/* 课程列表和服务记录详情 */}
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
                    
                    {/* 服务记录详情 */}
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
                              <h3 className="text-lg font-semibold text-slate-800">服务记录详情</h3>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">学生姓名</th>
                                    {course.schedule.map((_, index) => (
                                      <th key={index} className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {formatLessonTitle(course.id, index)}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {course.enrolledStudents.map((studentId) => (
                                    <tr key={studentId}>
                                      <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-800">
                                        {getStudentName(studentId)}
                                      </td>
                                      {course.schedule.map((_, index) => (
                                        <td key={index} className="whitespace-nowrap px-3 py-3">
                                          {editingCell && 
                                           editingCell.courseId === course.id && 
                                           editingCell.studentId === studentId && 
                                           editingCell.lessonIndex === index ? (
                                            <div className="flex items-center">
                                              <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    saveServiceRecord();
                                                  } else if (e.key === 'Escape') {
                                                    cancelEditing();
                                                  }
                                                }}
                                                className="w-full rounded border border-blue-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                autoFocus
                                              />
                                              <div className="ml-1 flex">
                                                <button
                                                  onClick={saveServiceRecord}
                                                  className="rounded bg-blue-500 p-1 text-xs text-white hover:bg-blue-600"
                                                >
                                                  <i className="fa-solid fa-check"></i>
                                                </button>
                                                <button
                                                  onClick={cancelEditing}
                                                  className="ml-1 rounded bg-gray-300 p-1 text-xs text-white hover:bg-gray-400"
                                                >
                                                  <i className="fa-solid fa-times"></i>
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div 
                                              className="min-h-[28px] cursor-pointer rounded border border-slate-200 p-1 text-xs text-slate-700 hover:border-blue-300"
                                              onClick={() => startEditing(course.id, studentId, index)}
                                              title="点击编辑"
                                            >
                                              {getServiceRecord(course.id, studentId, index) || '点击编辑'}
                                            </div>
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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