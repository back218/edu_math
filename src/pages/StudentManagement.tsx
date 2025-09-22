import { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext, Student } from '../contexts/appContext';
import { toast } from 'sonner';
import { generateId } from '../lib/utils';
import { Empty } from '../components/Empty';

export default function StudentManagement() {
  const { data, saveData } = useContext(AppContext);
  // 直接使用data.students作为初始值，确保组件加载时就有数据
  const [students, setStudents] = useState<Student[]>(data.students);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');
  // 批量删除相关状态
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const grades = ['六', '七', '八', '九', '高一', '高二', '高三'];

  // 初始化数据
  useEffect(() => {
    // 确保有初始数据
    if (data.students.length === 0) {
      createInitialStudents();
    }
  }, []);

  // 创建初始学生数据
  const createInitialStudents = () => {
    const initialStudents: Student[] = [
      { id: generateId(), name: '张三', grade: '七', isEnrolled: true, remark: '学习认真' },
      { id: generateId(), name: '李四', grade: '八', isEnrolled: true, remark: '成绩优异' },
      { id: generateId(), name: '王五', grade: '九', isEnrolled: false, remark: '需要加强练习' },
      { id: generateId(), name: '赵六', grade: '高一', isEnrolled: true, remark: '积极参与课堂' },
      { id: generateId(), name: '钱七', grade: '高二', isEnrolled: false, remark: '基础扎实' },
      { id: generateId(), name: '孙八', grade: '高三', isEnrolled: false, remark: '即将毕业' }
    ];
    
    saveData({ students: initialStudents });
  };

  // 加载学生数据 - 优化依赖项，确保数据变化时立即更新
  useEffect(() => {
    setStudents(data.students);
  }, [data.students]);

  // 筛选学生 - 每当筛选条件变化或students变化时重新筛选
  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, gradeFilter, enrollmentFilter]);

  // 筛选学生
  const filterStudents = () => {
    let result = [...students];
    
    if (searchQuery) {
      result = result.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (gradeFilter !== 'all') {
      result = result.filter(student => student.grade === gradeFilter);
    }
    
    if (enrollmentFilter !== 'all') {
      const isEnrolled = enrollmentFilter === 'enrolled';
      result = result.filter(student => student.isEnrolled === isEnrolled);
    }
    
    setFilteredStudents(result);
  };

  // 新增学生
  const handleAddStudent = () => {
    if (!currentStudent.name || !currentStudent.grade) {
      toast.error('请填写学生姓名和年级');
      return;
    }

    const newStudent: Student = {
      id: generateId(),
      name: currentStudent.name as string,
      grade: currentStudent.grade as string,
      isEnrolled: false, // 默认为未在读
      remark: currentStudent.remark || ''
    };

    const updatedStudents = [...students, newStudent];
    // 立即更新本地状态，确保UI即时反映
    setStudents(updatedStudents);
    saveData({ students: updatedStudents });
    
    // 重新筛选，确保过滤结果也更新
    filterStudents();
    
    toast.success('学生添加成功');
    resetForm();
    setShowAddModal(false);
  };

  // 编辑学生
  const handleEditStudent = () => {
    if (!currentStudent.id || !currentStudent.name || !currentStudent.grade) {
      toast.error('请填写完整的学生信息');
      return;
    }

    const updatedStudents = students.map(student => 
      student.id === currentStudent.id 
        ? { ...student, ...currentStudent } 
        : student
    );
    
    // 立即更新本地状态，确保UI即时反映
    setStudents(updatedStudents);
    saveData({ students: updatedStudents });
    
    // 重新筛选，确保过滤结果也更新
    filterStudents();
    
    toast.success('学生信息更新成功');
    setShowEditModal(false);
  };

   // 删除单个学生
  const handleDeleteStudent = (id: string) => {
    if (window.confirm('确定要删除这个学生吗？')) {
      const updatedStudents = students.filter(student => student.id !== id);
      // 立即更新本地状态，确保UI即时反映
      setStudents(updatedStudents);
      saveData({ students: updatedStudents });
      
      // 重新筛选，确保过滤结果也更新
      filterStudents();
      
      // 如果删除的学生在选中列表中，从列表中移除
      if (selectedStudentIds.includes(id)) {
        setSelectedStudentIds(selectedStudentIds.filter(studentId => studentId !== id));
      }
      
      toast.success('学生删除成功');
    }
  };
  
  // 批量删除学生
  const handleBatchDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    
    if (window.confirm(`确定要删除选中的 ${selectedStudentIds.length} 个学生吗？`)) {
      const updatedStudents = students.filter(student => !selectedStudentIds.includes(student.id));
      // 立即更新本地状态，确保UI即时反映
      setStudents(updatedStudents);
      saveData({ students: updatedStudents });
      
      // 清空选中状态
      setSelectedStudentIds([]);
      
      // 重新筛选，确保过滤结果也更新
      filterStudents();
      
      toast.success(`成功删除 ${selectedStudentIds.length} 个学生`);
    }
  };
  
  // 选择/取消选择单个学生
  const toggleStudentSelection = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(studentId => studentId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      // 如果已经全选，则取消全选
      setSelectedStudentIds([]);
    } else {
      // 否则全选当前筛选结果中的所有学生
      setSelectedStudentIds(filteredStudents.map(student => student.id));
    }
  };

  // 批量升学
  const handleBatchPromotion = () => {
    const updatedStudents = students.map(student => {
      let newGrade = student.grade;
      let newEnrollmentStatus = student.isEnrolled;
      
      switch (student.grade) {
        case '六':
          newGrade = '七';
          break;
        case '七':
          newGrade = '八';
          break;
        case '八':
          newGrade = '九';
          break;
        case '九':
          newGrade = '高一';
          break;
        case '高一':
          newGrade = '高二';
          break;
        case '高二':
          newGrade = '高三';
          break;
        case '高三':
          newGrade = '高三'; // 保持不变
          newEnrollmentStatus = false; // 毕业
          break;
        default:
          break;
      }
      
      return {
        ...student,
        grade: newGrade,
        isEnrolled: newEnrollmentStatus
      };
    });
    
    saveData({ students: updatedStudents });
    toast.success('批量升学操作完成');
  };

  // 重置表单
  const resetForm = () => {
    setCurrentStudent({});
  };

   // 打开编辑模态框
  const openEditModal = (student: Student) => {
    setCurrentStudent({ ...student });
    setShowEditModal(true);
  };

  // 批量生成测试数据
  const generateTestData = () => {
    const testStudentNames = [
      '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
      '郑一', '王二', '刘三', '陈四', '杨五', '黄六', '周七', '吴八',
      '徐九', '孙十', '胡一', '朱二', '高三', '林四', '何五', '郭六'
    ];
    
    const newStudents: Student[] = [];
    
    // 为每个年级生成一些学生
    grades.forEach(grade => {
      const studentsPerGrade = Math.floor(Math.random() * 5) + 3; // 每个年级3-7个学生
      
      for (let i = 0; i < studentsPerGrade; i++) {
        // 随机选择一个未使用的学生姓名
        const nameIndex = Math.floor(Math.random() * testStudentNames.length);
        const name = testStudentNames.splice(nameIndex, 1)[0];
        
        // 随机生成备注
        const remarks = ['学习认真', '成绩优异', '积极参与课堂', '需要加强练习', '基础扎实', ''];
        const remark = remarks[Math.floor(Math.random() * remarks.length)];
        
        // 根据年级设置不同的在读比例
        let isEnrolled = false;
        if (grade === '高三') {
          isEnrolled = Math.random() < 0.3; // 高三学生只有30%在读
        } else {
          isEnrolled = Math.random() < 0.7; // 其他年级70%在读
        }
        
        const student: Student = {
          id: generateId(),
          name,
          grade,
          isEnrolled,
          remark
        };
        
        newStudents.push(student);
      }
    });
    
    // 将新学生添加到现有学生中
    const updatedStudents = [...students, ...newStudents];
    saveData({ students: updatedStudents });
    // 直接更新组件内的状态，确保立即显示新添加的学生
    setStudents(updatedStudents);
    filterStudents();
    
    toast.success(`成功生成 ${newStudents.length} 条测试学生数据`);
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">学生管理</h1>
        <p className="text-slate-600">管理所有学生信息</p>
      </div>

      {/* 筛选和操作栏 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex w-full flex-wrap gap-4 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜索学生姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
          
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有年级</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}年级</option>
            ))}
          </select>
          
          <select
            value={enrollmentFilter}
            onChange={(e) => setEnrollmentFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">所有状态</option>
            <option value="enrolled">在读</option>
            <option value="not-enrolled">非在读</option>
          </select>
        </div>
        
         <div className="flex gap-3">
           <button
             onClick={handleBatchDeleteStudents}
             disabled={selectedStudentIds.length === 0}
             className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 ${
               selectedStudentIds.length > 0 
                 ? 'border border-red-300 bg-white text-red-700 hover:bg-red-50' 
                 : 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
             }`}
           >
             <i className="fa-solid fa-trash-alt mr-2"></i>
             批量删除 ({selectedStudentIds.length})
           </button>
           
           <button
             onClick={handleBatchPromotion}
             className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
           >
             <i className="fa-solid fa-graduation-cap mr-2"></i>
             批量升学
           </button>
           
           <button
             onClick={() => setShowAddModal(true)}
             className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
           >
             <i className="fa-solid fa-plus mr-2"></i>
             新增学生
           </button>
           <button
             onClick={generateTestData}
             className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200"
           >
             <i className="fa-solid fa-database mr-2"></i>
             生成测试数据
           </button>
         </div>
      </div>

      {/* 学生列表 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-md">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length > 0 && selectedStudentIds.length === filteredStudents.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      disabled={filteredStudents.length === 0}
                    />
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">学生ID</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">姓名</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">年级</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">在读状态</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">备注</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {filteredStudents.map((student) => (
                   <motion.tr 
                     key={student.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3 }}
                     className={`hover:bg-slate-50 ${selectedStudentIds.includes(student.id) ? 'bg-blue-50' : ''}`}
                   >
                     <td className="whitespace-nowrap px-4 py-4">
                       <input
                         type="checkbox"
                         checked={selectedStudentIds.includes(student.id)}
                         onChange={() => toggleStudentSelection(student.id)}
                         className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                     </td>
                     <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900">{student.id}</td>
                     <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">{student.name}</td>
                     <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900">{student.grade}年级</td>
                     <td className="whitespace-nowrap px-4 py-4">
                       <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                         student.isEnrolled 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-slate-100 text-slate-800'
                       }`}>
                         {student.isEnrolled ? '在读' : '非在读'}
                       </span>
                     </td>
                     <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{student.remark || '-'}</td>
                     <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                       <button
                         onClick={() => openEditModal(student)}
                         className="mr-2 text-blue-500 hover:text-blue-700"
                       >
                         <i className="fa-solid fa-edit"></i>
                       </button>
                       <button
                         onClick={() => handleDeleteStudent(student.id)}
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
        ) : (
          <Empty message="暂无学生数据" />
        )}
      </div>

      {/* 新增学生模态框 */}
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
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-xl font-bold text-slate-800">新增学生</h2>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">姓名</label>
              <input
                type="text"
                value={currentStudent.name || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="请输入学生姓名"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">年级</label>
              <select
                value={currentStudent.grade || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, grade: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">请选择年级</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}年级</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
              <textarea
                value={currentStudent.remark || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, remark: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="请输入备注信息（可选）"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
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
                onClick={handleAddStudent}
                className="rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 编辑学生模态框 */}
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
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-xl font-bold text-slate-800">编辑学生</h2>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">学生ID</label>
              <input
                type="text"
                value={currentStudent.id || ''}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 px-4 text-sm text-slate-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">姓名</label>
              <input
                type="text"
                value={currentStudent.name || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="请输入学生姓名"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">年级</label>
              <select
                value={currentStudent.grade || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, grade: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">请选择年级</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}年级</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">在读状态</label>
              <select
                value={currentStudent.isEnrolled ? 'true' : 'false'}
                onChange={(e) => setCurrentStudent({ ...currentStudent, isEnrolled: e.target.value === 'true' })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="true">在读</option>
                <option value="false">非在读</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
              <textarea
                value={currentStudent.remark || ''}
                onChange={(e) => setCurrentStudent({ ...currentStudent, remark: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="请输入备注信息（可选）"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
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
                onClick={handleEditStudent}
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