import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AttendanceChart from "@/components/charts/attendance-chart";
import { Users, GraduationCap, TrendingUp, Calendar, ClipboardCheck, Plus, Download, CalendarPlus } from "lucide-react";
import { Link } from "wouter";

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const todayClasses = classes?.slice(0, 3) || [];

  const statCards = [
    {
      title: "Total Classes",
      value: stats?.totalClasses || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Avg. Attendance",
      value: `${stats?.avgAttendance || 0}%`,
      icon: TrendingUp,
      color: "bg-ustp-gold/20 text-ustp-gold-dark",
    },
    {
      title: "Consultations",
      value: stats?.consultations || 0,
      icon: Calendar,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const quickActions = [
    {
      icon: ClipboardCheck,
      label: "Take Attendance",
      href: "/attendance",
    },
    {
      icon: Plus,
      label: "Add Class",
      href: "/classes",
    },
    {
      icon: Download,
      label: "Generate Report",
      href: "/reports",
    },
    {
      icon: CalendarPlus,
      label: "Schedule Meeting",
      href: "/consultations",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Dashboard"
          subtitle={`Welcome back, ${user?.firstName || "Teacher"}`}
        />

        <main className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Attendance</h3>
                <div className="h-64">
                  <AttendanceChart />
                </div>
              </CardContent>
            </Card>

            {/* Today's Classes */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Classes</h3>
                <div className="space-y-4">
                  {todayClasses.length > 0 ? (
                    todayClasses.map((cls: any, index: number) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? "bg-green-500" : index === 1 ? "bg-amber-500" : "bg-red-500"
                          }`}></div>
                          <div>
                            <p className="font-medium text-slate-900">{cls.code} - {cls.name}</p>
                            <p className="text-sm text-slate-500">{cls.schedule} • {cls.room}</p>
                          </div>
                        </div>
                        {index === 0 ? (
                          <Link href="/attendance">
                            <Button
                              size="sm"
                              className="bg-ustp-navy hover:bg-ustp-navy-light"
                            >
                              Take Attendance
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="secondary" disabled>
                            Upcoming
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No classes scheduled for today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="outline"
                        className="flex items-center space-x-3 p-4 h-auto justify-start w-full hover:bg-slate-50"
                      >
                        <Icon className="w-6 h-6 text-ustp-navy" />
                        <span className="font-medium">{action.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
