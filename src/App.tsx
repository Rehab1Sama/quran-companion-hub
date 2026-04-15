import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import LeaderDashboard from "./pages/leader/LeaderDashboard";
import HalaqatPage from "./pages/leader/HalaqatPage";
import DataEntryStatus from "./pages/leader/DataEntryStatus";
import AccountsPage from "./pages/leader/AccountsPage";
import StatisticsPage from "./pages/leader/StatisticsPage";
import RegistrationPage from "./pages/leader/RegistrationPage";
import AbsencesPage from "./pages/leader/AbsencesPage";
import DataEntryPage from "./pages/data-entry/DataEntryPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<LeaderDashboard />} />
            <Route path="/halaqat" element={<HalaqatPage />} />
            <Route path="/data-entry-status" element={<DataEntryStatus />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/absences" element={<AbsencesPage />} />
            <Route path="/data-entry" element={<DataEntryPage />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
