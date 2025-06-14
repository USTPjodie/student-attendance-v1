import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardCheck,
  Users,
  UserRound,
  BarChart3,
  Calendar,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      window.location.reload();
    },
  });

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/attendance", icon: ClipboardCheck, label: "Attendance" },
    { path: "/classes", icon: Users, label: "Classes" },
    { path: "/students", icon: UserRound, label: "Students" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/consultations", icon: Calendar, label: "Consultations" },
  ];

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-ustp-navy rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">USTP Attendance</h2>
            <p className="text-sm text-slate-500">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-ustp-navy text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center space-x-3 p-4 bg-slate-100 rounded-lg">
          <div className="w-10 h-10 bg-ustp-gold rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <p className="text-sm text-slate-500">Computer Science</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
