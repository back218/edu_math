import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const menuItems = [
    { id: 'dashboard', name: '仪表盘', icon: 'fa-tachometer-alt', color: 'bg-blue-500' },
    { id: 'students', name: '学生管理', icon: 'fa-users', color: 'bg-green-500' },
    { id: 'courses', name: '课程管理', icon: 'fa-book', color: 'bg-purple-500' },
    { id: 'attendance', name: '出勤管理', icon: 'fa-check-circle', color: 'bg-orange-500' },
    { id: 'service-records', name: '服务记录', icon: 'fa-clipboard-list', color: 'bg-red-500' },
    { id: 'calendar', name: '日历管理', icon: 'fa-calendar-alt', color: 'bg-indigo-500' },
    { id: 'settings', name: '设置', icon: 'fa-cog', color: 'bg-gray-500' }
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-slate-800">教育管理平台</h1>
        <p className="mt-2 text-slate-600">本地离线可移植的教育管理解决方案</p>
      </motion.div>
      
      <motion.div 
        className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            variants={fadeInUp}
            whileHover={{ y: -5, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-xl p-4 shadow-lg transition-all ${item.color}/10 hover:shadow-xl`}
            onClick={() => navigate(`/${item.id === 'dashboard' ? '' : item.id}`)}
          >
            <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${item.color} text-white`}>
              <i className={`fa-solid fa-${item.icon} text-xl`}></i>
            </div>
            <p className="font-medium text-slate-800">{item.name}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}