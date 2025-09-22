import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, Course } from '../contexts/appContext';
import { toast } from 'sonner';
import { generateId, generateCourseCalendar, formatDate, parseDate, exportToCSV } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function CourseManagement() {
  const { data, saveData } = useContext(AppContext);
  // 直接使用data.courses作为初始值，确保组件加载时就有数据
  const [courses, setCourses] = useState<Course[]>(data.courses);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 默认显示所有状态
  const [studentFilter, setStudentFilter] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 课程类型选项
  const courseTypes = [
    { value: 'spring', label: '春季' },
    { value: 'autumn', label: '秋季' },
    { value: 'winter', label: '寒假' },
    { value: 'summer', label: '暑假' }
  ];

  // 上课日选项
  const classDays = {
    spring: ['周五', '周六', '周日'],
    autumn: ['周五', '周六', '周日'],
    winter: ['一期', '二期', '三期'],
    summer: ['一期', '二期', '三期']
  };

  // 初始化数据
  useEffect(() => {
    // 确保有初始数据
    if (data.courses.length === 0) {
      createInitialCourses();
    }
  }, []);

  // 创建初始课程数据
  const createInitialCourses = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // 创建一些测试课程数据
    const initialCourses: Course[] = [
      {
        id: generateId(),
        name: '24年春周六A班',
        type: 'spring',
        上课Day: '周六',
        holidayRule: '',
        timeSlot: 'A 08:00',
        startTime: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        totalLessons: 15,
        enrolledStudents: data.students.map(s => s.id).slice(0, 3), // 关联前3个学生
        isCompleted: false,
        schedule: Array.from({length: 15}, (_, i) => {
          const date = new Date(year, month - 1, day);
          date.setDate(date.getDate() + i * 7);
          return formatDate(date);
        })
      },
      {
        id: generateId(),
        name: '24年秋周日B班',
        type: 'autumn',
        上课Day: '周日',
        holidayRule: '',
        timeSlot: 'B 10:10',
        startTime: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        totalLessons: 15,
        enrolledStudents: data.students.map(s => s.id).slice(3, 6), // 关联接下来3个学生
        isCompleted: true,
        schedule: Array.from({length: 15}, (_, i) => {
          const date = new Date(year, month - 1, day);
          date.setDate(date.getDate() + i * 7 + 1); // 周日
          return formatDate(date);
        })
      }
    ];
    
    saveData({ courses: initialCourses });
  };

  // 加载课程数据 - 优化依赖项，确保数据变化时立即更新
  useEffect(() => {
    setCourses(data.courses);
  }, [data.courses]);

  // 筛选课程 - 每当筛选条件变化或courses变化时重新筛选
  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, typeFilter, statusFilter, studentFilter]);

  // 筛选课程
  const filterCourses = () => {
    let result = [...courses];
    
    if (searchQuery) {
      result = result.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(course => course.type === typeFilter);
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(course => !course.isCompleted);
      } else if (statusFilter === 'completed') {
        result = result.filter(course => course.isCompleted);
      }
    }
    
    if (studentFilter !== 'all') {
      result = result.filter(course => 
        course.enrolledStudents.includes(studentFilter)
      );
    }
    
    setFilteredCourses(result);
  };

  // 自动生成课程名称
  const generateCourseName = (type: string, 上课Day: string, timeSlot: string) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    
    let typeText = '';
    switch (type) {
      case 'spring':
        typeText = '春';
        break;
      case 'autumn':
        typeText = '秋';
        break;
      case 'winter':
        typeText = '寒';
        break;
      case 'summer':
        typeText = '暑';
        break;
      default:
        typeText = '';
    }
    
    // 提取时段标识符（假设timeSlot格式为"A 08:00"）
    const slotId = timeSlot.split(' ')[0];
    
    // 提取期数或星期几
    let periodOrDay = 上课Day;
    if (['一期', '二期', '三期'].includes(上课Day)) {
      periodOrDay = 上课Day;
    }
    
    return `${year}年${typeText}${periodOrDay}${slotId}班`;
  };

  // 处理课程类型变化，更新默认值
  const handleCourseTypeChange = (type: string) => {
    const newType = type as 'spring' | 'autumn' | 'winter' | 'summer';
    setCurrentCourse({
      ...currentCourse,
      type: newType,
      上课Day: classDays[newType][0],
      holidayRule: newType === 'winter' || newType === 'summer' ? '上6天休1天' : ''
    });
  };

  // 处理时段变化，更新课程名称
  const handleTimeSlotChange = (timeSlot: string) => {
    if (currentCourse.type && currentCourse.上课Day) {
      const newName = generateCourseName(currentCourse.type, currentCourse.上课Day, timeSlot);
      setCurrentCourse({
        ...currentCourse,
        timeSlot,
        name: newName
      });
    } else {
      setCurrentCourse({
        ...currentCourse,
        timeSlot
      });
    }
  };

  // 处理上课日变化，更新课程名称
  const handleClassDayChange = (上课Day: string) => {
    if (currentCourse.type && currentCourse.timeSlot) {
      const newName = generateCourseName(currentCourse.type, 上课Day, currentCourse.timeSlot);
      setCurrentCourse({
        ...currentCourse,
        上课Day,
        name: newName
      });
    } else {
      setCurrentCourse({
        ...currentCourse,
        上课Day
      });
    }
  };

  // 新增课程
  const handleAddCourse = () => {
    if (!currentCourse.name || !currentCourse.type || !currentCourse.timeSlot || !currentCourse.startTime) {
      toast.error('请填写完整的课程信息');
      return;
    }

    const startDate = parseDate(currentCourse.startTime as string);
    const totalLessons = currentCourse.totalLessons || 15;
    
    // 生成课程日历
    const holidays = data.holidays.map(h => parseDate(h.date));
    const schedule = generateCourseCalendar(
      startDate,
      totalLessons,
      currentCourse.type as 'spring' | 'autumn' | 'winter' | 'summer',
      currentCourse.上课Day as string,
      currentCourse.holidayRule || '',
      holidays
    ).map(date => formatDate(date));

    const newCourse: Course = {
      id: generateId(),
      name: currentCourse.name as string,
      type: currentCourse.type as 'spring' | 'autumn' | 'winter' | 'summer',
      上课Day: currentCourse.上课Day as string,
      holidayRule: currentCourse.holidayRule || '',
      timeSlot: currentCourse.timeSlot as string,
      startTime: currentCourse.startTime as string,
      totalLessons: totalLessons,
      enrolledStudents: currentCourse.enrolledStudents || [],
      isCompleted: false,
      schedule: schedule
    };

    const updatedCourses = [...courses, newCourse];
    // 立即更新本地状态，确保UI即时反映
    setCourses(updatedCourses);
    saveData({ courses: updatedCourses });
    
    // 更新学生的在读状态
    const updatedStudents = data.students.map(student => ({
      ...student,
      isEnrolled: newCourse.enrolledStudents.includes(student.id) || student.isEnrolled
    }));
    saveData({ students: updatedStudents });
    
    toast.success('课程添加成功');
    resetForm();
    setShowAddModal(false);
  };

  // 编辑课程
  const handleEditCourse = () => {
    if (!currentCourse.id || !currentCourse.name || !currentCourse.type || !currentCourse.timeSlot || !currentCourse.startTime) {
      toast.error('请填写完整的课程信息');
      return;
    }

    const startDate = parseDate(currentCourse.startTime as string);
    const totalLessons = currentCourse.totalLessons || 15;
    
    // 生成课程日历
    const holidays = data.holidays.map(h => parseDate(h.date));
    const schedule = generateCourseCalendar(
      startDate,
      totalLessons,
      currentCourse.type as 'spring' | 'autumn' | 'winter' | 'summer',
      currentCourse.上课Day as string,
      currentCourse.holidayRule || '',
      holidays
    ).map(date => formatDate(date));

    const updatedCourses = courses.map(course => 
      course.id === currentCourse.id 
        ? { 
            ...course, 
            ...currentCourse, 
            totalLessons: totalLessons,
            schedule: schedule
          } 
        : course
    );
    
    // 立即更新本地状态，确保UI即时反映
    setCourses(updatedCourses);
    saveData({ courses: updatedCourses });
    
    // 更新学生的在读状态
    const allActiveCourses = updatedCourses.filter(c => !c.isCompleted);
    const updatedStudents = data.students.map(student => ({
      ...student,
      isEnrolled: allActiveCourses.some(course => course.enrolledStudents.includes(student.id))
    }));
    saveData({ students: updatedStudents });
    
    toast.success('课程信息更新成功');
    setShowEditModal(false);
  };

  // 删除课程
  const handleDeleteCourse = (id: string) => {
    if (window.confirm('确定要删除这个课程吗？')) {
      const updatedCourses = courses.filter(course => course.id !== id);
      // 立即更新本地状态，确保UI即时反映
      setCourses(updatedCourses);
      saveData({ courses: updatedCourses });
      
      // 更新学生的在读状态
      const allActiveCourses = updatedCourses.filter(c => !c.isCompleted);
      const updatedStudents = data.students.map(student => ({
        ...student,
        isEnrolled: allActiveCourses.some(course => course.enrolledStudents.includes(student.id))
      }));
      saveData({ students: updatedStudents });
      
      // 重新筛选课程，确保过滤结果也更新
      filterCourses();
       
      toast.success('课程删除成功');
    }
  };

  // 标记课程结课状态
  const handleToggleCompletion = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
    const updatedCourses = courses.map(course => 
      course.id === id 
        ? { ...course, isCompleted: !course.isCompleted } 
        : course
    );
    
    saveData({ courses: updatedCourses });
    
    // 更新学生的在读状态
    const allActiveCourses = updatedCourses.filter(c => !c.isCompleted);
    const updatedStudents = data.students.map(student => ({
      ...student,
      isEnrolled: allActiveCourses.some(course => course.enrolledStudents.includes(student.id))
    }));
    saveData({ students: updatedStudents });
    
    toast.success(`课程${course.isCompleted ? '重新激活' : '标记为结课'}成功`);
  };

  // 复制课程
  const handleCopyCourse = (course: Course) => {
    setCurrentCourse({
      name: '', // 课程名称需要重新生成
      type: course.type,
      上课Day: course.上课Day,holidayRule: course.holidayRule,
      timeSlot: course.timeSlot,
      startTime: formatDate(new Date()), // 默认使用当前日期
      totalLessons: course.totalLessons,
      enrolledStudents: [...course.enrolledStudents] // 复制关联的学生
    });
    setShowAddModal(true);
  };

  // 打开添加学生到课程的模态框
  const openAddStudentModal = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    setSelectedCourseId(courseId);
    
    // 找出未在该课程中的学生
    const notEnrolledStudents = data.students.filter(student => 
      !course.enrolledStudents.includes(student.id)
    ).map(student => student.id);
    
    setAvailableStudents(notEnrolledStudents);
    setShowAddStudentModal(true);
  };

  // 添加学生到课程
  const handleAddStudentToCourse = () => {
    if (!selectedCourseId) return;
    
    const updatedCourses = courses.map(course => 
      course.id === selectedCourseId 
        ? { ...course, enrolledStudents: availableStudents } 
        : course
    );
    
    saveData({ courses: updatedCourses });
    
    // 更新学生的在读状态
    const allActiveCourses = updatedCourses.filter(c => !c.isCompleted);
    const updatedStudents = data.students.map(student => ({
      ...student,
      isEnrolled: allActiveCourses.some(course => course.enrolledStudents.includes(student.id))
    }));
    saveData({ students: updatedStudents });
    
    toast.success('学生添加成功');
    setShowAddStudentModal(false);
    setSelectedCourseId(null);
  };

  // 切换学生选择
  const toggleStudentSelection = (studentId: string) => {
    if (availableStudents.includes(studentId)) {
      setAvailableStudents(availableStudents.filter(id => id !== studentId));
    } else {
      setAvailableStudents([...availableStudents, studentId]);
    }
  };

  // 导出课程表
  const handleExportSchedule = () => {
    const exportData = filteredCourses.map(course => {
      // 获取课程的学生姓名列表
      const studentNames = course.enrolledStudents
        .map(id => data.students.find(s => s.id === id)?.name)
        .filter(name => name)
        .join(', ');
      
      return {
        '课程名称': course.name,
        '课程类型': courseTypes.find(t => t.value === course.type)?.label || course.type,
        '上课日/期数': course.上课Day,
        '上课时间': course.timeSlot,
        '开始日期': course.startTime,
        '课时总数': course.totalLessons,
        '是否结课': course.isCompleted ? '是' : '否',
        '学生名单': studentNames
      };
    });
    
    exportToCSV(exportData, `课程表_${formatDate(new Date())}.csv`);
    toast.success('课程表导出成功');
  };

  // 重置表单
  const resetForm = () => {
    setCurrentCourse({});
  };

  // 打开编辑模态框
  const openEditModal = (course: Course) => {
    setCurrentCourse({ ...course });
    setShowEditModal(true);
  };

  // 获取学生姓名
  const getStudentName = (id: string): string => {
    return data.students.find(student => student.id === id)?.name || id;
  };
  
  // 获取学生备注
  const getStudentRemark = (id: string): string => {
    return data.students.find(student => student.id === id)?.remark || '无';
  };
  
  // 计算学生在未结课课程中的缺课次数
  const getAbsentCount = (studentId: string, currentCourseId: string): number => {
    let absentCount = 0;
    
    // 获取所有未结课的课程
    const activeCourses = data.courses.filter(course => !course.isCompleted);
    
    activeCourses.forEach(course => {
      // 检查学生是否在该课程中
      if (course.enrolledStudents.includes(studentId)) {
        // 计算该课程中的缺课次数
        for (let i = 0; i < course.schedule.length; i++) {
          const status = data.attendance[course.id]?.[studentId]?.[i.toString()];
          if (status === 'absent') {
            absentCount++;
          }
        }
      }
    });
    
    return absentCount;
  };
  
   // 获取学生续费状态
  const getRenewalStatus = (studentId: string, courseId: string): string => {
    const status = data.renewals[courseId]?.[studentId]?.status;
    switch (status) {
      case 'renewed':
        return '已续费';
      case 'not-renewed':
        return '未续费';
      case 'pending':
        return '待确认';
      default:
        return '未设置';
    }
  };
  
  // 更新学生续费状态
  const updateRenewalStatus = (courseId: string, studentId: string, status: 'renewed' | 'not-renewed' | 'pending' | '') => {
    // 创建更新后的续费记录
    const updatedRenewals = { ...data.renewals };
    
    if (!updatedRenewals[courseId]) {
      updatedRenewals[courseId] = {};
    }
    
    if (!updatedRenewals[courseId][studentId]) {
      updatedRenewals[courseId][studentId] = { status: 'not-renewed', remark: '' };
    }
    
    if (status) {
      updatedRenewals[courseId][studentId].status = status;
    } else {
      // 如果状态为空，删除该记录
      if (Object.keys(updatedRenewals[courseId][studentId]).length === 1) {
        // 如果只有状态字段，则删除整个学生对象
        delete updatedRenewals[courseId][studentId];
        // 如果课程下没有学生了，则删除整个课程对象
        if (Object.keys(updatedRenewals[courseId]).length === 0) {
          delete updatedRenewals[courseId];
        }
      } else {
        // 否则只删除状态字段
        delete updatedRenewals[courseId][studentId].status;
      }
    }
    
    // 保存更新后的数据
    saveData({ renewals: updatedRenewals });
  };
  
  // 更新学生续费备注
  const updateRenewalRemark = (courseId: string, studentId: string, remark: string) => {
    // 创建更新后的续费记录
    const updatedRenewals = { ...data.renewals };
    
    if (!updatedRenewals[courseId]) {
      updatedRenewals[courseId] = {};
    }
    
    if (!updatedRenewals[courseId][studentId]) {
      updatedRenewals[courseId][studentId] = { status: 'not-renewed', remark: '' };
    }
    
    updatedRenewals[courseId][studentId].remark = remark;
    
    // 保存更新后的数据
    saveData({ renewals: updatedRenewals });
  };
  
  // 获取学生续费备注
  const getRenewalRemark = (studentId: string, courseId: string): string => {
    return data.renewals[courseId]?.[studentId]?.remark || '无';
  };
  
  // 渲染学生详情
  const renderStudentDetails = (studentId: string, courseId: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">学生姓名:</span>
          <span className="text-sm text-slate-800">{student.name}</span>
        </div>
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">年级:</span>
          <span className="text-sm text-slate-800">{student.grade}年级</span>
        </div>
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">备注:</span>
          <span className="text-sm text-slate-800">{getStudentRemark(studentId)}</span>
        </div>
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">缺课次数:</span>
          <span className="text-sm text-slate-800">{getAbsentCount(studentId, courseId)}次</span>
        </div>
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">续费状态:</span>
          <span className={`text-sm ${
            getRenewalStatus(studentId, courseId) === '已续费' 
              ? 'text-green-600' 
              : getRenewalStatus(studentId, courseId) === '未续费'
                ? 'text-red-600'
                : getRenewalStatus(studentId, courseId) === '待确认'
                  ? 'text-yellow-600'
                  : 'text-slate-800'
          }`}>
            {getRenewalStatus(studentId, courseId)}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-20 text-sm font-medium text-slate-600">续费备注:</span>
          <span className="text-sm text-slate-800">{getRenewalRemark(studentId, courseId)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">课程管理</h1>
        <p className="text-slate-600">管理所有课程信息</p>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有类型</option>
            {courseTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有状态</option>
            <option value="active">未结课</option>
            <option value="completed">已结课</option>
          </select>
          
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有学生</option>
            {data.students.map(student => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportSchedule}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-download mr-2"></i>
            导出课程表
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            新增课程
          </button>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="grid gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            // 计算课程进度
            const progress = Math.round((course.schedule.filter(date => new Date(date) <= new Date()).length / course.totalLessons) * 100);
            
            return (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              className={`rounded-xl border ${
                course.isCompleted 
                  ? 'border-slate-200 bg-slate-50' 
                  : 'border-slate-200 bg-white shadow-md'
              } p-4 transition-all hover:shadow-lg`}
              onClick={(e) => {
                // 避免点击学生相关元素时触发课程卡片的点击事件
                if (!e.target.closest('.student-details-trigger')) {
                  setExpandedStudentIds(prev => prev.filter(id => id !== course.id));
                  setSelectedStudentId(null);
                }
              }}
            >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{course.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        course.type === 'spring' ? 'bg-green-100 text-green-800' :
                        course.type === 'autumn' ? 'bg-yellow-100 text-yellow-800' :
                        course.type === 'winter' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {courseTypes.find(t => t.value === course.type)?.label}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                        {course.timeSlot}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                        {course.上课Day}
                      </span>
                      {course.isCompleted && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          已结课
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openAddStudentModal(course.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <i className="fa-solid fa-user-plus mr-1"></i>
                      添加学生
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <i className="fa-solid fa-edit mr-1"></i>
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleCompletion(course.id)}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                        course.isCompleted 
                          ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-200' 
                          : 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 focus:ring-orange-200'
                      }`}
                    >
                      {course.isCompleted ? '重新激活' : '标记结课'}
                    </button>
                    <button
                      onClick={() => handleCopyCourse(course)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>
                      复制
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      删除
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">课程进度</span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div 
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-slate-700">课程信息</h4>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex items-center text-sm">
                      <i className="fa-solid fa-calendar-alt mr-2 text-slate-400"></i>
                      <span className="text-slate-500">开始日期: </span>
                      <span className="ml-1 text-slate-700">{course.startTime}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <i className="fa-solid fa-book-open mr-2 text-slate-400"></i>
                      <span className="text-slate-500">总课时: </span>
                      <span className="ml-1 text-slate-700">{course.totalLessons}次</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <i className="fa-solid fa-users mr-2 text-slate-400"></i>
                      <span className="text-slate-500">学生人数: </span>
                      <span className="ml-1 text-slate-700">{course.enrolledStudents.length}人</span>
                    </div>
                    {course.holidayRule && (
                      <div className="flex items-center text-sm">
                        <i className="fa-solid fa-calendar-check mr-2 text-slate-400"></i>
                        <span className="text-slate-500">放假规则: </span>
                        <span className="ml-1 text-slate-700">{course.holidayRule}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                 <div className="w-full">
                    <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700">学生名单</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStudentIds(prev => 
                        prev.includes(course.id)
                          ? prev.filter(id => id !== course.id)
                          : [...prev, course.id]
                      );
                      // 如果展开，默认选中第一个学生
                      if (!expandedStudentIds.includes(course.id) && course.enrolledStudents.length > 0) {
                        setSelectedStudentId(course.enrolledStudents[0]);
                      }
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {expandedStudentIds.includes(course.id) ? '收起' : '展开详情'}
                  </button>
                </div>
                
                  {/* 学生详情展开视图 */}
                  {expandedStudentIds.includes(course.id) ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 rounded-lg border border-slate-200 overflow-hidden"
                    >
                      {/* 表头 */}
                      <div className="grid grid-cols-6 bg-slate-50 p-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <div className="col-span-1">学生姓名</div>
                        <div className="col-span-1">备注</div>
                        <div className="col-span-1">缺课次数</div>
                        <div className="col-span-1">是否续费</div>
                        <div className="col-span-2">续费备注</div>
                      </div>
                      
                      {/* 学生列表 */}
                      {course.enrolledStudents.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {course.enrolledStudents.map(studentId => {
                            const student = data.students.find(s => s.id === studentId);
                            if (!student) return null;
                            
                            return (
                              <div 
                                key={studentId}
                                className={`grid grid-cols-6 p-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                                  selectedStudentId === studentId ? 'bg-blue-50' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentId(prev => prev === studentId ? null : studentId);
                                }}
                              >
                                 <div className="col-span-1 font-medium text-slate-800">{student.name}</div>
                                <div className="col-span-1 text-sm text-slate-600 truncate">{getStudentRemark(studentId)}</div>
                                <div className="col-span-1 text-sm text-slate-600">{getAbsentCount(studentId, course.id)}次</div>
                                <div className="col-span-1">
                                  <select
                                    value={getRenewalStatus(studentId, course.id)}
                                    onChange={(e) => {
                                      const statusMap = {
                                        '未设置': '',
                                        '已续费': 'renewed',
                                        '未续费': 'not-renewed',
                                        '待确认': 'pending'
                                      };
                                      updateRenewalStatus(course.id, studentId, statusMap[e.target.value as keyof typeof statusMap] as any);
                                    }}
                                    className={`rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                      getRenewalStatus(studentId, course.id) === '已续费' 
                                        ? 'border-green-300 bg-green-50 text-green-700' 
                                        : getRenewalStatus(studentId, course.id) === '未续费'
                                          ? 'border-red-300 bg-red-50 text-red-700'
                                          : getRenewalStatus(studentId, course.id) === '待确认'
                                            ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                            : 'border-slate-300 bg-white text-slate-700'
                                    }`}
                                  >
                                    <option value="未设置">未设置</option>
                                    <option value="已续费">已续费</option>
                                    <option value="未续费">未续费</option>
                                    <option value="待确认">待确认</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    value={getRenewalRemark(studentId, course.id)}
                                    onChange={(e) => updateRenewalRemark(course.id, studentId, e.target.value)}
                                    placeholder="添加备注..."
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500">暂无学生</div>
                      )}
                    </motion.div>
                  ) : (
                    // 未展开时显示的标签云样式
                    <div className="flex flex-wrap gap-2">
                      {course.enrolledStudents.length > 0 ? (
                        course.enrolledStudents.map(studentId => (
                          <span 
                            key={studentId}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStudentIds([course.id]);
                              setSelectedStudentId(studentId);
                            }}
                          >
                            {getStudentName(studentId)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">暂无学生</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <Empty message="暂无课程数据" />
        )}
      </div>

      {/* 新增课程模态框 */}
      {showAddModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-xl font-bold text-slate-800">新增课程</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课程名称</label>
                <input
                  type="text"
                  value={currentCourse.name || ''}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="课程名称（自动生成）"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课程类型</label>
                <select
                  value={currentCourse.type || ''}
                  onChange={(e) => handleCourseTypeChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">请选择课程类型</option>
                  {courseTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {currentCourse.type && ['winter', 'summer'].includes(currentCourse.type) 
                    ? '期数' 
                    : '上课日'}
                </label>
                <select
                  value={currentCourse.上课Day || ''}
                  onChange={(e) => handleClassDayChange(e.target.value)}
                  disabled={!currentCourse.type}
                  className={`w-full rounded-lg border py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    currentCourse.type 
                      ? 'border-slate-300' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <option value="">请选择</option>
                  {currentCourse.type && classDays[currentCourse.type as keyof typeof classDays].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">上课时间</label>
                <select
                  value={currentCourse.timeSlot || ''}
                  onChange={(e) => handleTimeSlotChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">请选择时段</option>
                  {data.timeSlots.map(slot => (
                    <option key={slot.id} value={`${slot.id} ${slot.time}`}>
                      {slot.id} {slot.time}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">开始日期</label>
                <input
                  type="date"
                  value={currentCourse.startTime || ''}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, startTime: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课时总数</label>
                <input
                  type="number"
                  value={currentCourse.totalLessons || 15}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, totalLessons: parseInt(e.target.value) })}
                  min="1"
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              {(currentCourse.type && ['winter', 'summer'].includes(currentCourse.type)) && (
                <div className="mb-4 md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">假期上课规则</label>
                  <input
                    type="text"
                    value={currentCourse.holidayRule || '上6天休1天'}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, holidayRule: e.target.value })}
                    placeholder="格式：上x天休y天"
                    className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}
              
              <div className="mb-4 md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">选择学生</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-2">
                  {data.students.length > 0 ? (
                    data.students.map(student => (
                      <div 
                        key={student.id}
                        className="mb-2 flex items-center"
                      >
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={currentCourse.enrolledStudents?.includes(student.id) || false}
                          onChange={() => {
                            if (!currentCourse.enrolledStudents) {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: [student.id]
                              });
                            } else if (currentCourse.enrolledStudents.includes(student.id)) {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: currentCourse.enrolledStudents.filter(id => id !== student.id)
                              });
                            } else {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: [...currentCourse.enrolledStudents, student.id]
                              });
                            }
                          }}
                          className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`student-${student.id}`}
                          className="text-sm text-slate-700"
                        >
                          {student.name} ({student.grade}年级)
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">暂无学生数据</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
              <button
                onClick={handleAddCourse}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 编辑课程模态框 */}
      {showEditModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-xl font-bold text-slate-800">编辑课程</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课程名称</label>
                <input
                  type="text"
                  value={currentCourse.name || ''}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="课程名称"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课程类型</label>
                <select
                  value={currentCourse.type || ''}
                  onChange={(e) => handleCourseTypeChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {courseTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {currentCourse.type && ['winter', 'summer'].includes(currentCourse.type) 
                    ? '期数' 
                    : '上课日'}
                </label>
                <select
                  value={currentCourse.上课Day || ''}
                  onChange={(e) => handleClassDayChange(e.target.value)}
                  disabled={!currentCourse.type}
                  className={`w-full rounded-lg border py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    currentCourse.type 
                      ? 'border-slate-300' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {currentCourse.type && classDays[currentCourse.type as keyof typeof classDays].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">上课时间</label>
                <select
                  value={currentCourse.timeSlot || ''}
                  onChange={(e) => handleTimeSlotChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {data.timeSlots.map(slot => (
                    <option key={slot.id} value={`${slot.id} ${slot.time}`}>
                      {slot.id} {slot.time}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">开始日期</label>
                <input
                  type="date"
                  value={currentCourse.startTime || ''}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, startTime: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">课时总数</label>
                <input
                  type="number"
                  value={currentCourse.totalLessons || 15}
                  onChange={(e) => setCurrentCourse({ ...currentCourse, totalLessons: parseInt(e.target.value) })}
                  min="1"
                  className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              {(currentCourse.type && ['winter', 'summer'].includes(currentCourse.type)) && (
                <div className="mb-4 md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">假期上课规则</label>
                  <input
                    type="text"
                    value={currentCourse.holidayRule || '上6天休1天'}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, holidayRule: e.target.value })}
                    placeholder="格式：上x天休y天"
                    className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}
              
              <div className="mb-4 md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">选择学生</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-2">
                  {data.students.length > 0 ? (
                    data.students.map(student => (
                      <div 
                        key={student.id}
                        className="mb-2 flex items-center"
                      >
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={currentCourse.enrolledStudents?.includes(student.id) || false}
                          onChange={() => {
                            if (!currentCourse.enrolledStudents) {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: [student.id]
                              });
                            } else if (currentCourse.enrolledStudents.includes(student.id)) {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: currentCourse.enrolledStudents.filter(id => id !== student.id)
                              });
                            } else {
                              setCurrentCourse({
                                ...currentCourse,
                                enrolledStudents: [...currentCourse.enrolledStudents, student.id]
                              });
                            }
                          }}
                          className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`student-${student.id}`}
                          className="text-sm text-slate-700"
                        >
                          {student.name} ({student.grade}年级)
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">暂无学生数据</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
              <button
                onClick={handleEditCourse}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加学生到课程模态框 */}
      {showAddStudentModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-xl font-bold text-slate-800">添加学生到课程</h2>
            
            <div className="mb-6">
              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-300 p-2">
                {data.students.length > 0 ? (
                  data.students.map(student => {
                    // 检查该学生是否已经在课程中
                    const course = courses.find(c => c.id === selectedCourseId);
                    const isEnrolled = course?.enrolledStudents.includes(student.id) || false;
                    
                    if (isEnrolled) {
                      // 已在课程中的学生显示为不可选择
                      return (
                        <div key={student.id} className="mb-2 flex items-center opacity-50">
                          <input
                            type="checkbox"
                            checked
                            disabled
                            className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-slate-700">
                            {student.name} ({student.grade}年级)
                          </label>
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            已在课程中
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={student.id} className="mb-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={availableStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm text-slate-700">
                          {student.name} ({student.grade}年级)
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">暂无学生数据</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setSelectedCourseId(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
              <button
                onClick={handleAddStudentToCourse}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                添加
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}