import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', name: '仪表盘', icon: 'tachometer-alt', active: false },
    { path: '/students', name: '学生管理', icon: 'users', active: false },
    { path: '/courses', name: '课程管理', icon: 'book', active: false },
    { path: '/attendance', name: '出勤管理', icon: 'check-circle', active: false },
    { path: '/service-records', name: '服务记录', icon: 'clipboard-list', active: false },
    { path: '/calendar', name: '日历管理', icon: 'calendar-alt', active: false },
    { path: '/settings', name: '设置', icon: 'cog', active: false }
  ];

  // 检查当前路径是否匹配菜单项
  const getActiveMenuItem = () => {
    return menuItems.map(item => ({
      ...item,
      active: location.pathname === item.path
    }));
  };

  return (
    <div className={`flex h-full overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
      {/* 侧边栏 */}
      <motion.div
        initial={{ width: isSidebarOpen ? '240px' : '64px' }}
        animate={{ width: isSidebarOpen ? '240px' : '64px' }}
        transition={{ duration: 0.3 }}
        className={`relative flex flex-col border-r ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}
      >
        {/* 品牌标识 */}
        <div className={`flex items-center justify-between border-b p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <motion.div
            initial={{ opacity: isSidebarOpen ? 1 : 0 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span className="font-bold">教育管理平台</span>
          </motion.div>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`rounded-full p-1.5 transition-colors ${
              theme === 'dark' 
                ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Toggle sidebar"
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>
        
        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {getActiveMenuItem().map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.active 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <i className={`fa-solid fa-${item.icon} text-lg`}></i>
                  
                  <motion.span
                    initial={{ opacity: isSidebarOpen ? 1 : 0 }}
                    animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`ml-3 ${!isSidebarOpen && 'sr-only'}`}
                  >
                    {item.name}
                  </motion.span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* 用户信息和主题切换 */}
        <div className={`border-t p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: isSidebarOpen ? 1 : 0 }}
              animate={{ opacity: isSidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <div className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <div className="text-sm font-medium">管理员</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>本地账户</div>
              </div>
            </motion.div>
            
            <button
              onClick={toggleTheme}
              className={`rounded-full p-1.5 transition-colors ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label="Toggle theme"
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {/* 顶部导航栏 */}
        <header className={`flex items-center justify-between border-b p-4 ${
          theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`mr-4 rounded-full p-1.5 transition-colors md:hidden ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label="Toggle sidebar"
            >
              <i className={`fa-solid ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            <h1 className="text-xl font-semibold">
              {getActiveMenuItem().find(item => item.active)?.name || '仪表盘'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              className={`rounded-full p-2 transition-colors relative ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label="Notifications"
            >
              <i className="fa-solid fa-bell"></i>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            <button
              onClick={toggleTheme}
              className={`rounded-full p-2 transition-colors ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label="Toggle theme"
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </header>
        
        {/* 内容区域 */}
        <main className="h-[calc(100%-64px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}