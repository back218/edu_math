import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, Holiday, TimeSlot } from '../contexts/appContext';
import { toast } from 'sonner';
import { generateId, formatDate, parseDate } from '../lib/utils';
import { Empty } from '../components/Empty';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const { data, saveData } = useContext(AppContext);
  const { theme, toggleTheme } = useTheme();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showAddTimeSlotModal, setShowAddTimeSlotModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [newHoliday, setNewHoliday] = useState<{
    date: string;
    name: string;
  }>({
    date: '',
    name: ''
  });
  const [newTimeSlot, setNewTimeSlot] = useState<{
    id: string;
    time: string;
  }>({
    id: '',
    time: '08:00'
  });

  // 加载数据
  useEffect(() => {
    setHolidays(data.holidays);
    setTimeSlots(data.timeSlots);
    
    // 如果没有节假日数据，初始化当前年份的节假日
    if (data.holidays.length === 0) {
      initializeHolidays(currentYear);
    }
  }, [data.holidays, data.timeSlots, currentYear]);

  // 初始化节假日
  const initializeHolidays = (year: number) => {
    // 这里是示例节假日，实际应用中可以根据需要修改
    const defaultHolidays: Holiday[] = [
      { id: generateId(), date: `${year}-01-01`, name: '元旦' },
      { id: generateId(), date: `${year}-02-11`, name: '春节' },
      { id: generateId(), date: `${year}-02-12`, name: '春节' },
      { id: generateId(), date: `${year}-02-13`, name: '春节' },
      { id: generateId(), date: `${year}-04-04`, name: '清明节' },
      { id: generateId(), date: `${year}-05-01`, name: '劳动节' },
      { id: generateId(), date: `${year}-06-14`, name: '端午节' },
      { id: generateId(), date: `${year}-10-01`, name: '国庆节' },
      { id: generateId(), date: `${year}-10-02`, name: '国庆节' },
      { id: generateId(), date: `${year}-10-03`, name: '国庆节' }
    ];
    
    setHolidays(defaultHolidays);
    saveData({ holidays: defaultHolidays });
  };

  // 添加节假日
  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error('请填写完整的节假日信息');
      return;
    }

    const holiday: Holiday = {
      id: generateId(),
      date: newHoliday.date,
      name: newHoliday.name
    };

    const updatedHolidays = [...holidays, holiday];
    setHolidays(updatedHolidays);
    saveData({ holidays: updatedHolidays });
    
    toast.success('节假日添加成功');
    setShowAddHolidayModal(false);
    setNewHoliday({ date: '', name: '' });
  };

  // 删除节假日
  const handleDeleteHoliday = (id: string) => {
    if (window.confirm('确定要删除这个节假日吗？')) {
      const updatedHolidays = holidays.filter(holiday => holiday.id !== id);
      setHolidays(updatedHolidays);
      saveData({ holidays: updatedHolidays });
      toast.success('节假日删除成功');
    }
  };

  // 添加时段
  const handleAddTimeSlot = () => {
    if (!newTimeSlot.id || !newTimeSlot.time) {
      toast.error('请填写完整的时段信息');
      return;
    }

    // 检查时段ID是否已存在
    if (timeSlots.some(slot => slot.id === newTimeSlot.id)) {
      toast.error('时段ID已存在，请使用其他ID');
      return;
    }

    const timeSlot: TimeSlot = {
      id: newTimeSlot.id,
      time: newTimeSlot.time
    };

    const updatedTimeSlots = [...timeSlots, timeSlot];
    setTimeSlots(updatedTimeSlots);
    saveData({ timeSlots: updatedTimeSlots });
    
    toast.success('时段添加成功');
    setShowAddTimeSlotModal(false);
    setNewTimeSlot({ id: '', time: '08:00' });
  };

  // 删除时段
  const handleDeleteTimeSlot = (id: string) => {
    // 不能删除所有时段
    if (timeSlots.length <= 1) {
      toast.error('至少需要保留一个时段');
      return;
    }
    
    if (window.confirm('确定要删除这个时段吗？')) {
      const updatedTimeSlots = timeSlots.filter(slot => slot.id !== id);
      setTimeSlots(updatedTimeSlots);
      saveData({ timeSlots: updatedTimeSlots });
      toast.success('时段删除成功');
    }
  };

  // 切换主题
  const handleToggleTheme = () => {
    toggleTheme();
    toast.success(`已切换到${theme === 'light' ? '深色' : '浅色'}模式`);
  };

  // 重置所有数据
  const handleResetData = () => {
    if (window.confirm('确定要重置所有数据吗？这将删除所有已保存的信息，且无法恢复！')) {
      // 初始化默认数据
      const initialData = {
        students: [],
        courses: [],
        attendance: {},
        serviceRecords: {},
        renewals: {},
        events: [],
        holidays: [],
        timeSlots: [
          { id: 'A', time: '08:00' },
          { id: 'B', time: '10:10' },
          { id: 'C', time: '14:00' },
          { id: 'D', time: '16:10' }
        ]
      };
      
      localStorage.setItem('education-system-data', JSON.stringify(initialData));
      window.location.reload();
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">设置</h1>
        <p className="text-slate-600">系统配置和管理</p>
      </div>

      {/* 主题设置 */}
      <motion.div 
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">外观设置</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-700">主题模式</h3>
            <p className="text-xs text-slate-500">选择应用的显示主题</p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-3 text-sm text-slate-600">{theme === 'light' ? '浅色' : '深色'}</span>
            <button
              onClick={handleToggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                theme === 'light' ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <motion.div
                layout
                className="h-4 w-4 rounded-full bg-white transition-transform"
                initial={theme === 'light' ? { x: 0 } : { x: 16 }}
                animate={{ x: theme === 'light' ? 0 : 16 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 节假日管理 */}
      <motion.div 
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">节假日管理</h2>
          
          <div className="flex items-center gap-3">
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="rounded-lg border border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setNewHoliday({
                  date: '',
                  name: ''
                });
                setShowAddHolidayModal(true);
              }}
              className="rounded-lg border border-transparent bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <i className="fa-solid fa-plus mr-1"></i>
              添加节假日
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">日期</th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">名称</th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {holidays
                .filter(holiday => {
                  const holidayYear = parseDate(holiday.date).getFullYear();
                  return holidayYear === currentYear;
                })
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((holiday) => (
                  <motion.tr 
                    key={holiday.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{holiday.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{holiday.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 时段配置 */}
      <motion.div 
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">时段配置</h2>
          
          <button
            onClick={() => {
              setNewTimeSlot({
                id: '',
                time: '08:00'
              });
              setShowAddTimeSlotModal(true);
            }}
            className="rounded-lg border border-transparent bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <i className="fa-solid fa-plus mr-1"></i>
            添加时段
          </button>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {timeSlots.map((slot) => (
            <motion.div 
              key={slot.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-800">{slot.id}</div>
                  <div className="text-sm text-slate-600">{slot.time}</div>
                </div>
                <button
                  onClick={() => handleDeleteTimeSlot(slot.id)}
                  disabled={timeSlots.length <= 1}
                  className={`rounded-full p-1.5 transition-colors ${
                    timeSlots.length <= 1
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 系统操作 */}
      <motion.div 
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">系统操作</h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleResetData}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            <i className="fa-solid fa-redo-alt mr-2"></i>
            重置所有数据
          </button>
          
          <div className="ml-auto text-sm text-slate-500">
            数据存储在本地浏览器中，可离线使用
          </div>
        </div>
      </motion.div>

      {/* 添加节假日模态框 */}
      {showAddHolidayModal && (
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
            <h2 className="mb-4 text-xl font-bold text-slate-800">添加节假日</h2>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">日期</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">节假日名称</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="请输入节假日名称"
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddHolidayModal(false);
                  setNewHoliday({ date: '', name: '' });
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
              <button
                onClick={handleAddHoliday}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加时段模态框 */}
      {showAddTimeSlotModal && (
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
            <h2 className="mb-4 text-xl font-bold text-slate-800">添加时段</h2>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">时段标识</label>
              <input
                type="text"
                value={newTimeSlot.id}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, id: e.target.value.toUpperCase() })}
                placeholder="如：A, B, C..."
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={2}
              />
            </div>
            
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">开始时间</label>
              <input
                type="time"
                value={newTimeSlot.time}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddTimeSlotModal(false);
                  setNewTimeSlot({ id: '', time: '08:00' });
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                取消
              </button>
              <button
                onClick={handleAddTimeSlot}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}