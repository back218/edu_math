import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/appContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const { data } = useContext(AppContext);
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    enrolledStudents: 0,
    activeCourses: 0,
    completedCourses: 0,
  });

  // 计算统计数据
  useEffect(() => {
    const enrolledCount = data.students.filter(student => student.isEnrolled).length;
    const activeCount = data.courses.filter(course => !course.isCompleted).length;
    const completedCount = data.courses.filter(course => course.isCompleted).length;

    setStatistics({
      totalStudents: data.students.length,
      enrolledStudents: enrolledCount,
      activeCourses: activeCount,
      completedCourses: completedCount,
    });
  }, [data]);

  // 饼图数据 - 学生年级分布
  const gradeDistribution = () => {
    const gradeMap: Record<string, number> = {};
    data.students.forEach(student => {
      gradeMap[student.grade] = (gradeMap[student.grade] || 0) + 1;
    });
    
    return Object.entries(gradeMap).map(([name, value]) => ({ name, value }));
  };

  // 柱状图数据 - 课程类型分布
  const courseTypeDistribution = () => {
    const typeMap: Record<string, number> = {
      '春季': 0,
      '秋季': 0,
      '寒假': 0,
      '暑假': 0,
    };
    
    data.courses.forEach(course => {
      switch (course.type) {
        case 'spring':
          typeMap['春季']++;
          break;
        case 'autumn':
          typeMap['秋季']++;
          break;
        case 'winter':
          typeMap['寒假']++;
          break;
        case 'summer':
          typeMap['暑假']++;
          break;
      }
    });
    
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const menuItems = [
    { id: 'students', name: '学生管理', icon: 'fa-users', color: 'bg-blue-500', count: statistics.totalStudents },
    { id: 'courses', name: '课程管理', icon: 'fa-book', color: 'bg-green-500', count: data.courses.length },
    { id: 'attendance', name: '出勤管理', icon: 'fa-check-circle', color: 'bg-purple-500', count: statistics.activeCourses },
    { id: 'calendar', name: '日历管理', icon: 'fa-calendar-alt', color: 'bg-orange-500', count: data.events.length + statistics.activeCourses }
  ];

  return (
    <div className="h-full overflow-auto p-4">
      <motion.div 
        className="mb-6 space-y-2"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
        <p className="text-slate-600">欢迎使用教育管理平台</p>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div 
        className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">学生总数</p>
              <h3 className="text-2xl font-bold text-slate-800">{statistics.totalStudents}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-500">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-500">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            <span>{statistics.enrolledStudents} 名在读</span>
          </div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">课程总数</p>
              <h3 className="text-2xl font-bold text-slate-800">{data.courses.length}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-500">
              <i className="fa-solid fa-book"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-500">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            <span>{statistics.activeCourses} 门进行中</span>
          </div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">在读学生</p>
              <h3 className="text-2xl font-bold text-slate-800">{statistics.enrolledStudents}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3 text-purple-500">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-slate-500">占总学生比例: </span>
            <span className="ml-1 font-medium text-slate-800">
              {data.students.length > 0 
                ? Math.round((statistics.enrolledStudents / data.students.length) * 100) 
                : 0}%
            </span>
          </div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">结课课程</p>
              <h3 className="text-2xl font-bold text-slate-800">{statistics.completedCourses}</h3>
            </div>
            <div className="rounded-full bg-orange-100 p-3 text-orange-500">
              <i className="fa-solid fa-check-circle"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-slate-500">占总课程比例: </span>
            <span className="ml-1 font-medium text-slate-800">
              {data.courses.length > 0 
                ? Math.round((statistics.completedCourses / data.courses.length) * 100) 
                : 0}%
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* 快捷菜单 */}
      <motion.div 
        className="mb-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">快捷入口</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -5, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              className={`cursor-pointer rounded-xl p-4 shadow-md transition-all hover:shadow-xl ${item.color}/10`}
              onClick={() => navigate(`/${item.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-3 flex h-10 w-10 items-center justify-center rounded-full ${item.color} text-white`}>
                    <i className={`fa-solid fa-${item.icon}`}></i>
                  </div>
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  {item.count}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 数据可视化 */}
      <motion.div 
        className="grid gap-6 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              delay: 0.4,
              staggerChildren: 0.2
            }
          }
        }}
      >
        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800">学生年级分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          className="rounded-xl bg-white p-4 shadow-md"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800">课程类型分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={courseTypeDistribution()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="课程数量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}