import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, CalendarEvent } from '../contexts/appContext';
import { toast } from 'sonner';
import { generateId, formatDate, parseDate } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function CalendarManagement() {
  const { data, saveData } = useContext(AppContext);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    date: string;
    time: string;
  }>({
    title: '',
    date: '',
    time: ''
  });

  // 加载事件数据
  useEffect(() => {
    setEvents(data.events);
  }, [data.events]);

  // 生成日历数据
  const generateCalendarData = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 获取当月第一天是星期几 (0-6, 0是星期日)
    const firstDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // 添加上个月的尾巴天数
    for (let i = firstDayOfWeek; i > 0; i--) {
      const day = new Date(currentYear, currentMonth, -i + 1);
      calendarDays.push({
        date: day,
        isCurrentMonth: false,
        isToday: formatDate(day) === formatDate(new Date())
      });
    }
    
    // 添加当月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(currentYear, currentMonth, i);
      calendarDays.push({
        date: day,
        isCurrentMonth: true,
        isToday: formatDate(day) === formatDate(new Date())
      });
    }
    
    // 添加上个月的开头天数，使总天数为42（6行7列）
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(currentYear, currentMonth + 1, i);
      calendarDays.push({
        date: day,
        isCurrentMonth: false,
        isToday: formatDate(day) === formatDate(new Date())
      });
    }
    
    return calendarDays;
  };

  // 生成周视图数据
  const generateWeekData = () => {
    // 获取当前月份的第一天
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // 计算当前周的第一天（周一）
    const firstDayOfWeek = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfWeek.getDay() || 7; // 转换为1-7，1是周一
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - (dayOfWeek - 1));
    
    const weekDays = [];
    
    // 添加一周的7天
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(day.getDate() + i);
      weekDays.push({
        date: day,
        isCurrentMonth: day.getMonth() === currentMonth,
        isToday: formatDate(day) === formatDate(new Date())
      });
    }
    
    return weekDays;
  };

  // 获取指定日期的事件
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // 获取指定日期的课程
  const getCoursesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return data.courses
      .filter(course => course.schedule.includes(dateStr) && !course.isCompleted)
      .sort((a, b) => {
        // 按上课时间排序
        const timeA = a.timeSlot.split(' ')[1];
        const timeB = b.timeSlot.split(' ')[1];
        return timeA.localeCompare(timeB);
      });
  };

  // 处理日期点击
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEvent({
      title: '',
      date: formatDate(date),
      time: '09:00'
    });
    setShowAddEventModal(true);
  };

  // 添加新事件
  const handleAddEvent = () => {
    if (!newEvent.title) {
      toast.error('请输入事件名称');
      return;
    }

    const event: CalendarEvent = {
      id: generateId(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      isCourse: false
    };

    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    saveData({ events: updatedEvents });
    
    toast.success('事件添加成功');
    setShowAddEventModal(false);
    setNewEvent({ title: '', date: '', time: '' });
  };

  // 删除事件
  const handleDeleteEvent = (id: string) => {
    if (window.confirm('确定要删除这个事件吗？')) {
      const updatedEvents = events.filter(event => event.id !== id);
      setEvents(updatedEvents);
      saveData({ events: updatedEvents });
      toast.success('事件删除成功');
    }
  };
  
  // 编辑事件
  const handleEditEvent = () => {
    if (!newEvent.title) {
      toast.error('请输入事件名称');
      return;
    }

    if (!selectedEventId) {
      toast.error('未选择事件');
      return;
    }

    const updatedEvents = events.map(event => 
      event.id === selectedEventId 
        ? { ...event, title: newEvent.title, date: newEvent.date, time: newEvent.time } 
        : event
    );
    
    setEvents(updatedEvents);
    saveData({ events: updatedEvents });
    
    toast.success('事件更新成功');
    setShowAddEventModal(false);
    setSelectedEventId(null);
    setNewEvent({ title: '', date: '', time: '' });
  };
  
  // 打开编辑事件模态框
  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time
    });
    setShowAddEventModal(true);
  };

  // 上一个月/周
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentMonth(prev => {
        if (prev === 0) {
          setCurrentYear(prevYear => prevYear - 1);
          return 11;
        }
        return prev - 1;
      });
    } else {
      // 周视图：减去7天
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      firstDayOfMonth.setDate(firstDayOfMonth.getDate() - 7);
      setCurrentYear(firstDayOfMonth.getFullYear());
      setCurrentMonth(firstDayOfMonth.getMonth());
    }
  };

  // 下一个月/周
  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentMonth(prev => {
        if (prev === 11) {
          setCurrentYear(prevYear => prevYear + 1);
          return 0;
        }
        return prev + 1;
      });
    } else {
      // 周视图：加上7天
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      firstDayOfMonth.setDate(firstDayOfMonth.getDate() + 7);
      setCurrentYear(firstDayOfMonth.getFullYear());
      setCurrentMonth(firstDayOfMonth.getMonth());
    }
  };

  // 切换到今天
  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // 获取月份名称
  const getMonthName = (monthIndex: number) => {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return monthNames[monthIndex];
  };

  // 获取星期几名称
  const getDayName = (dayIndex: number) => {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    return dayNames[dayIndex];
  };

  // 渲染月视图
  const renderMonthView = () => {
    const calendarDays = generateCalendarData();
    
    return (
      <div className="mt-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <div key={index} className={`text-xs font-medium py-2 ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-slate-600'
            }`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dateEvents = getEventsForDate(day.date);
            const dateCourses = getCoursesForDate(day.date);
            const totalItems = dateEvents.length + dateCourses.length;
            return (
              <div 
                key={index}
                className={`min-h-[120px] p-1 rounded-lg border transition-all hover:border-blue-300 ${
                  day.isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : day.isCurrentMonth 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50'
                } ${
                  !day.isCurrentMonth ? 'opacity-50' : ''
                }`}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
              >
                <div className={`flex items-center justify-between px-1 py-0.5 ${
                  day.isToday 
                    ? 'rounded-full bg-blue-500 text-white' 
                    : (day.date.getDay() === 0 || day.date.getDay() === 6) 
                      ? 'text-red-500' 
                      : 'text-slate-600'
                }`}>
                  <span className="text-xs font-medium">{day.date.getDate()}</span>
                </div>
                
                <div className="mt-1 max-h-[100px] overflow-y-auto text-left text-xs pr-1">
                  {dateCourses.map((course, i) => (
                    <div 
                      key={i}
                      className="mb-1 rounded px-1 py-0.5 bg-green-100 text-green-800 truncate"
                      title={course.name}
                    >
                      {course.name}
                    </div>
                  ))}
                  
                    {dateEvents.map((event) => (
                       <div 
                         key={event.id}
                         className="mb-1 rounded px-1 py-0.5 bg-blue-100 text-blue-800 truncate cursor-pointer hover:bg-blue-200 transition-colors relative"
                         title={`${event.time} ${event.title}`}
                         onClick={() => openEditEventModal(event)}
                       >
                         {event.time} {event.title}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteEvent(event.id);
                           }}
                           className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
                           title="删除事件"
                         >
                           <i className="fa-solid fa-times text-xs"></i>
                         </button>
                       </div>
                     ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染周视图
  const renderWeekView = () => {
    const weekDays = generateWeekData();
    
    return (
      <div className="mt-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, index) => (
            <div key={index} className={`text-xs font-medium py-2 ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-slate-600'
            }`}>
              {getDayName(day.date.getDay())} {day.date.getMonth() + 1}/{day.date.getDate()}
              {day.isToday && <span className="ml-1 text-blue-500">今天</span>}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mt-2">
          {weekDays.map((day, index) => {
            const dateEvents = getEventsForDate(day.date);
            const dateCourses = getCoursesForDate(day.date);
            
            // 合并课程和事件，并按时间排序
            const allItems = [
              ...dateCourses.map(course => ({
                id: course.id,
                title: course.name,
                time: course.timeSlot.split(' ')[1],
                type: 'course'
              })),
              ...dateEvents.map(event => ({
                id: event.id,
                title: event.title,
                time: event.time,
                type: 'event'
              }))
            ].sort((a, b) => a.time.localeCompare(b.time));
            
            return (
              <div 
                key={index}
                className={`min-h-[300px] p-1 rounded-lg border transition-all hover:border-blue-300 ${
                  day.isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : day.isCurrentMonth 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50'
                } ${
                  !day.isCurrentMonth ? 'opacity-50' : ''
                }`}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
              >
                <div className="overflow-auto max-h-[300px]">
                  {allItems.map((item) => (
                       <div 
                          key={item.id}
                          className={`mb-2 rounded px-2 py-1.5 text-xs ${
                            item.type === 'course' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors'
                          }`}
                          title={item.title}
                          onClick={() => item.type === 'event' && openEditEventModal({
                            id: item.id,
                            title: item.title,
                            date: formatDate(day.date),
                            time: item.time,
                            isCourse: false
                          })}
                        >
                          <div className="font-medium">{item.time}</div>
                          <div className="truncate">{item.title}</div>
                          {item.type === 'event' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(item.id);
                              }}
                              className="float-right text-red-500 hover:text-red-700"
                              title="删除事件"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          )}
                        </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">日历管理</h1>
        <p className="text-slate-600">查看和管理课程及事件安排</p>
      </div>

      {/* 日历控制栏 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={prevPeriod}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          
          <h2 className="text-lg font-semibold text-slate-800">
            {viewMode === 'month' 
              ? `${currentYear}年 ${getMonthName(currentMonth)}`
              : `${currentYear}年 ${getMonthName(currentMonth)}`}
          </h2>
          
          <button
            onClick={nextPeriod}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          
          <button
            onClick={goToToday}
            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            今天
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">视图:</span>
          <button
            onClick={() => setViewMode('month')}
            className={`rounded-l-lg border-y border-l border-slate-300 px-3 py-1 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              viewMode === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`rounded-r-lg border-y border-r border-slate-300 px-3 py-1 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              viewMode === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            周
          </button>
          
          <button
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              setNewEvent({
                title: '',
                date: formatDate(today),
                time: '09:00'
              });
              setShowAddEventModal(true);
            }}
            className="rounded-lg border border-transparent bg-blue-500 px-4 py-1 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-plus mr-1"></i>
            添加事件
          </button>
        </div>
      </div>

      {/* 日历内容 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* 事件添加模态框 */}
      {showAddEventModal && selectedDate && (
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
             <h2 className="mb-4 text-xl font-bold text-slate-800">{selectedEventId ? '编辑事件' : '添加事件'}</h2>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">日期</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">时间</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">事件名称</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="请输入事件名称"
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddEventModal(false);
                  setNewEvent({ title: '', date: '', time: '' });
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
             <button
                onClick={selectedEventId ? handleEditEvent : handleAddEvent}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {selectedEventId ? '更新' : '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}