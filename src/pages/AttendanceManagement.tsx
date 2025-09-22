import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, AttendanceRecord } from '../contexts/appContext';
import { toast } from 'sonner';
import { formatDate, exportToCSV } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function AttendanceManagement() {
  const { data, saveData } = useContext(AppContext);
  const [courses, setCourses] = useState(data.courses);
  const [filteredCourses, setFilteredCourses] = useState(data.courses);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 加载数据
  useEffect(() => {
    setCourses(data.courses);
    setAttendanceData(data.attendance);
    filterCourses();
  }, [data.courses, data.attendance, searchQuery, statusFilter]);

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

  // 获取出勤状态的样式
  const getAttendanceStatusStyle = (status: 'present' | 'absent' | 'makeup' | undefined) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'makeup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // 获取出勤状态的中文文本
  const getAttendanceStatusText = (status: 'present' | 'absent' | 'makeup') => {
    switch (status) {
      case 'present':
        return '出勤';
      case 'absent':
        return '请假';
      case 'makeup':
        return '已补';
      default:
        return '未知';
    }
  };

  // 检查课程是否已经上过（日期早于或等于今天）
  const isLessonCompleted = (courseId: string, lessonIndex: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.schedule[lessonIndex]) return false;
    
    const lessonDate = new Date(course.schedule[lessonIndex]);
    const today = new Date();
    // 忽略时间部分，只比较日期
    lessonDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return lessonDate <= today;
  };

  // 获取出勤状态（对于已完成的课程，默认出勤）
  const getAttendanceStatus = (courseId: string, studentId: string, lessonIndex: number): 'present' | 'absent' | 'makeup' | undefined => {
    // 先从现有数据中获取状态
    const existingStatus = attendanceData[courseId]?.[studentId]?.[lessonIndex.toString()];
    
    // 如果有现有状态，直接返回
    if (existingStatus) {
      return existingStatus;
    }
    
    // 如果没有现有状态且课程已完成，则默认出勤
    if (isLessonCompleted(courseId, lessonIndex)) {
      return 'present';
    }
    
    // 对于还没上的课，不设置默认状态
    return undefined;
  };

  // 更新出勤状态
  const updateAttendanceStatus = (courseId: string, studentId: string, lessonIndex: number, status: 'present' | 'absent' | 'makeup') => {
    const updatedAttendance = { ...attendanceData };
    
    if (!updatedAttendance[courseId]) {
      updatedAttendance[courseId] = {};
    }
    
    if (!updatedAttendance[courseId][studentId]) {
      updatedAttendance[courseId][studentId] = {};
    }
    
    updatedAttendance[courseId][studentId][lessonIndex.toString()] = status;
    setAttendanceData(updatedAttendance);
    saveData({ attendance: updatedAttendance });
  };

  // 批量更新出勤状态
  const batchUpdateAttendance = (courseId: string, studentIds: string[], status: 'present' | 'absent' | 'makeup') => {
    const updatedAttendance = { ...attendanceData };
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    studentIds.forEach(studentId => {
      if (!updatedAttendance[courseId]) {
        updatedAttendance[courseId] = {};
      }
      
      if (!updatedAttendance[courseId][studentId]) {
        updatedAttendance[courseId][studentId] = {};
      }
      
      for (let i = 0; i < course.schedule.length; i++) {
        updatedAttendance[courseId][studentId][i.toString()] = status;
      }
    });
    
    setAttendanceData(updatedAttendance);
    saveData({ attendance: updatedAttendance });
    toast.success(`批量更新了 ${studentIds.length} 名学生的出勤状态`);
  };

  // 导出出勤表
  const handleExportAttendance = () => {
    if (!selectedCourseId) return;
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;
    
    const exportData = course.enrolledStudents.map(studentId => {
      const row: any = {
        '学生姓名': getStudentName(studentId)
      };
      
      course.schedule.forEach((date, index) => {
        const status = getAttendanceStatus(selectedCourseId!, studentId, index);
        const statusText = status === 'present' ? '出勤' : status === 'absent' ? '请假' : '已补';
        row[`第${index + 1}次课（${date}）`] = statusText;
      });
      
      return row;
    });
    
    exportToCSV(exportData, `出勤表_${course.name}_${formatDate(new Date())}.csv`);
    toast.success('出勤表导出成功');
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">出勤管理</h1>
        <p className="text-slate-600">管理学生出勤情况</p>
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
            onClick={handleExportAttendance}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-download mr-2"></i>
            导出出勤表
          </button>
        )}
      </div>

      {/* 课程列表和出勤详情 */}
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
                    
                    {/* 出勤详情 */}
                    {selectedCourseId === course.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={6} className="p-0">
                          <div className="border-t border-slate-200 bg-white p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-slate-800">出勤详情</h3>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    batchUpdateAttendance(course.id, course.enrolledStudents, 'present');
                                  }}
                                  className="rounded-lg border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-200"
                                >
                                  批量出勤
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    batchUpdateAttendance(course.id, course.enrolledStudents, 'absent');
                                  }}
                                  className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                                >
                                  批量请假
                                </button>
                              </div>
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
                                        <td key={index} className="whitespace-nowrap px-3 py-3 text-center">
                                            <select
                                              value={getAttendanceStatus(course.id, studentId, index) || ''}
                                              onChange={(e) => updateAttendanceStatus(
                                                course.id, 
                                                studentId, 
                                                index, 
                                                e.target.value as 'present' | 'absent' | 'makeup'
                                              )}
                                              disabled={!isLessonCompleted(course.id, index) && !getAttendanceStatus(course.id, studentId, index)}
                                              className={`rounded border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                getAttendanceStatusStyle(getAttendanceStatus(course.id, studentId, index) || 'present')
                                              } ${!isLessonCompleted(course.id, index) && !getAttendanceStatus(course.id, studentId, index) ? 'opacity-50' : ''}`}
                                            >
                                              <option value="">--</option>
                                              <option value="present">出勤</option>
                                              <option value="absent">请假</option>
                                              <option value="makeup">已补</option>
                                            </select>
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