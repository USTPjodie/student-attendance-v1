import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import TeacherDashboard from "@/pages/teacher/dashboard";
import AttendanceScreen from "@/pages/teacher/attendance";
import ClassesScreen from "@/pages/teacher/classes";
import StudentsScreen from "@/pages/teacher/students";
import ReportsScreen from "@/pages/teacher/reports";
import ConsultationsScreen from "@/pages/teacher/consultations";
import StudentDashboard from "@/pages/student/dashboard";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ustp-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <Route path="/" component={Login} />
      ) : user.role === "teacher" ? (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/attendance" component={AttendanceScreen} />
          <Route path="/classes" component={ClassesScreen} />
          <Route path="/students" component={StudentsScreen} />
          <Route path="/reports" component={ReportsScreen} />
          <Route path="/consultations" component={ConsultationsScreen} />
        </>
      ) : (
        <>
          <Route path="/" component={StudentDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
