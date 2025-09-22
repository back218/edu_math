import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import StudentManagement from "./pages/StudentManagement";
import CourseManagement from "./pages/CourseManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import ServiceRecords from "./pages/ServiceRecords";
import CalendarManagement from "./pages/CalendarManagement";
import Settings from "./pages/Settings";
import { AppProvider } from "./contexts/appContext";

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/courses" element={<CourseManagement />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="/service-records" element={<ServiceRecords />} />
            <Route path="/calendar" element={<CalendarManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
