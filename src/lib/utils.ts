import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成唯一ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化日期
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 解析日期
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// 导出数据到CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 检查日期是否为节假日
export const isHoliday = (date: Date, holidays: Date[]): boolean => {
  const dateStr = formatDate(date);
  return holidays.some(holiday => formatDate(holiday) === dateStr);
};

// 生成课程日历
export const generateCourseCalendar = (
  startDate: Date, 
  totalLessons: number, 
  courseType: 'spring' | 'autumn' | 'winter' | 'summer',
 上课Day: string, // 对于春秋是星期几，对于寒暑是期数
  holidayRule: string, // 仅寒暑假适用，格式"上x天休y天"
  holidays: Date[]
): Date[] => {
  const result: Date[] = [];
  let currentDate = new Date(startDate);
  let lessonCount = 0;
  
  if (courseType === 'spring' || courseType === 'autumn') {
    // 春秋课程：按星期几排课
    const targetDay = ['周五', '周六', '周日'].indexOf(上课Day) + 5; // 转换为0-6的星期几，周五是5，周六6，周日0
    
    while (lessonCount < totalLessons) {
      const currentDay = currentDate.getDay();
      const daysToAdd = (targetDay - currentDay + 7) % 7;
      
      if (daysToAdd > 0) {
        currentDate.setDate(currentDate.getDate() + daysToAdd);
      }
      
      // 检查是否为节假日，节假日顺延
      if (!isHoliday(currentDate, holidays)) {
        result.push(new Date(currentDate));
        lessonCount++;
      }
      
      // 移动到下一周
      currentDate.setDate(currentDate.getDate() + 7);
    }
  } else {
    // 寒暑假课程：按"上x天休y天"规则
    const match = holidayRule.match(/上(\d+)天休(\d+)天/);
    const workDays = match ? parseInt(match[1]) : 1;
    const restDays = match ? parseInt(match[2]) : 0;
    
    let workCount = 0;
    let restCount = 0;
    let isWorking = true;
    
    while (lessonCount < totalLessons) {
      if (isWorking) {
        // 工作日
        if (!isHoliday(currentDate, holidays)) {
          result.push(new Date(currentDate));
          lessonCount++;
        }
        
        workCount++;
        if (workCount >= workDays) {
          workCount = 0;
          isWorking = false;
        }
      } else {
        // 休息日
        restCount++;
        if (restCount >= restDays) {
          restCount = 0;
          isWorking = true;
        }
      }
      
      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return result;
};
