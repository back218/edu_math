import { createContext, useContext, useState, useEffect } from 'react';

// 定义类型接口
export interface Student {
  id: string;
  name: string;
  grade: string;
  isEnrolled: boolean;
  remark?: string;
}

export interface Course {
  id: string;
  name: string;
  type: 'spring' | 'autumn' | 'winter' | 'summer';
  上课Day: string;
  holidayRule?: string;
  timeSlot: string;
  startTime: string;
  totalLessons: number;
  enrolledStudents: string[];
  isCompleted: boolean;
  schedule: string[];
}

export interface AttendanceRecord {
  [courseId: string]: {
    [studentId: string]: {
      [lessonIndex: string]: 'present' | 'absent' | 'makeup';
    };
  };
}

export interface ServiceRecord {
  [courseId: string]: {
    [studentId: string]: {
      [lessonIndex: string]: string;
    };
  };
}

export interface RenewalRecord {
  [courseId: string]: {
    [studentId: string]: {
      status: 'renewed' | 'not-renewed' | 'pending';
      remark?: string;
    };
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  isCourse?: boolean;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface TimeSlot {
  id: string;
  time: string;
}

export interface AppData {
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord;
  serviceRecords: ServiceRecord;
  renewals: RenewalRecord;
  events: CalendarEvent[];
  holidays: Holiday[];
  timeSlots: TimeSlot[];
}

interface AppContextType {
  data: AppData;
  saveData: (updatedData: Partial<AppData>) => void;
}

// 创建上下文
const AppContext = createContext<AppContextType | undefined>(undefined);

// 初始化默认数据 - 添加一些预设的mock数据
const initializeDefaultData = (): AppData => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 生成默认学生数据
  const defaultStudents: Student[] = [
    { id: '1', name: '张三', grade: '七', isEnrolled: true, remark: '学习认真' },
    { id: '2', name: '李四', grade: '八', isEnrolled: true, remark: '成绩优异' },
    { id: '3', name: '王五', grade: '九', isEnrolled: false, remark: '需要加强练习' },
    { id: '4', name: '赵六', grade: '高一', isEnrolled: true, remark: '积极参与课堂' },
    { id: '5', name: '钱七', grade: '高二', isEnrolled: false, remark: '基础扎实' },
    { id: '6', name: '孙八', grade: '高三', isEnrolled: false, remark: '即将毕业' }
  ];
  
  // 生成默认课程数据
  const defaultCourses: Course[] = [
    {
      id: '1',
      name: '24年春周六A班',
      type: 'spring',
      上课Day: '周六',
      holidayRule: '',
      timeSlot: 'A 08:00',
      startTime: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      totalLessons: 15,
      enrolledStudents: ['1', '2', '4'], // 关联几个学生
      isCompleted: false,
schedule: Array.from({length: 15}, (_, i) => {
          const date = new Date(year, month - 1, day);
          date.setDate(date.getDate() + i * 7);
          const year2 = date.getFullYear();
          const month2 = String(date.getMonth() + 1).padStart(2, '0');
          const day2 = String(date.getDate()).padStart(2, '0');
          return `${year2}-${month2}-${day2}`;
        })
    }
  ];
  
  return {
    students: defaultStudents,
    courses: defaultCourses,
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
};

// 上下文提供者组件
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<AppData>(() => {
    const savedData = localStorage.getItem('education-system-data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
        return initializeDefaultData();
      }
    }
    return initializeDefaultData();
  });

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem('education-system-data', JSON.stringify(data));
  }, [data]);

  // 更新数据的方法 - 优化性能，直接返回新对象
  const saveData = (updatedData: Partial<AppData>) => {
    setData(prevData => ({
      ...prevData,
      ...updatedData
    }));
  };

  return React.createElement(
    AppContext.Provider,
    { value: { data, saveData } },
    children
  );
};

// 自定义Hook，方便使用上下文
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// 导出AppContext，确保可以直接导入
export { AppContext };
export default AppContext;