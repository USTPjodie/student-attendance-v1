import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import {
  GraduationCap,
  CheckCircle,
  BookOpen,
  Award,
  Calendar,
  Download,
  LogOut,
  Book,
  Clock,
  User,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");

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

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades", { studentId: user?.student?.id }],
    enabled: !!user?.student?.id,
  });

  const { data: consultations } = useQuery({
    queryKey: ["/api/consultations"],
  });

  // Mock student classes with attendance data
  const studentClasses = [
    {
      id: 1,
      code: "CS 101",
      name: "Programming Fundamentals",
      instructor: "Prof. Smith",
      schedule: "MWF 9:00-10:30 AM",
      attendanceRate: 95,
      present: 19,
      total: 20,
    },
    {
      id: 2,
      code: "CS 201",
      name: "Data Structures",
      instructor: "Prof. Johnson",
      schedule: "TTh 1:00-2:30 PM",
      attendanceRate: 88,
      present: 15,
      total: 17,
    },
    {
      id: 3,
      code: "MATH 203",
      name: "Discrete Mathematics",
      instructor: "Prof. Davis",
      schedule: "MWF 2:00-3:30 PM",
      attendanceRate: 75,
      present: 12,
      total: 16,
    },
  ];

  const studentInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "ST";

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return "bg-green-600";
    if (rate >= 75) return "bg-yellow-600";
    return "bg-red-600";
  };

  const tabs = [
    { id: "attendance", label: "Attendance" },
    { id: "grades", label: "Grades" },
    { id: "consultations", label: "Consultations" },
    { id: "schedule", label: "Schedule" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-ustp-navy rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">USTP Student Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-ustp-gold rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{studentInitials}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user ? `${user.firstName} ${user.lastName}` : "Student"}
                </span>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.firstName || "Student"}!
          </h2>
          <p className="text-slate-600">Here's your academic overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overall Attendance</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.attendanceRate || "92.5"}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Classes Enrolled</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats?.classCount || studentClasses.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Current GPA</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {user?.student?.gpa || "3.75"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-ustp-gold/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-ustp-gold-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Consultations</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats?.consultations || "3"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Card>
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-ustp-navy text-ustp-navy"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <CardContent className="p-6">
            {activeTab === "attendance" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Attendance Overview</h3>
                  <Button className="bg-ustp-gold hover:bg-ustp-gold-dark">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                {/* Class Attendance List */}
                <div className="space-y-4">
                  {studentClasses.map((cls) => (
                    <div key={cls.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-ustp-navy rounded-lg flex items-center justify-center">
                            <Book className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {cls.code} - {cls.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {cls.instructor} • {cls.schedule}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${getAttendanceColor(cls.attendanceRate)}`}>
                            {cls.attendanceRate}%
                          </p>
                          <p className="text-sm text-slate-500">
                            {cls.present}/{cls.total} present
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                          <span>Attendance Progress</span>
                          <span>{cls.present}/{cls.total} classes</span>
                        </div>
                        <Progress value={cls.attendanceRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Book Consultation CTA */}
                <div className="mt-8 bg-gradient-to-r from-ustp-navy to-ustp-navy-light rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">Need Help Improving Attendance?</h4>
                      <p className="text-blue-100 mt-1">Book a consultation with your professors</p>
                    </div>
                    <Button 
                      onClick={() => setActiveTab("consultations")}
                      className="bg-white text-ustp-navy hover:bg-slate-100"
                    >
                      Book Consultation
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "grades" && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Grade Reports</h3>
                <div className="space-y-4">
                  {studentClasses.map((cls) => (
                    <Card key={cls.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-900">
                            {cls.code} - {cls.name}
                          </h4>
                          <span className="text-sm text-slate-500">{cls.instructor}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">Assignment 1:</span>
                            <span className="ml-2 font-medium">95/100</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Midterm Exam:</span>
                            <span className="ml-2 font-medium">88/100</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Current Grade:</span>
                            <span className="ml-2 font-medium text-green-600">A-</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "consultations" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Consultation Requests</h3>
                  <Button className="bg-ustp-navy hover:bg-ustp-navy-light">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book New Consultation
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-10 h-10 text-ustp-navy" />
                          <div>
                            <p className="font-medium text-slate-900">Prof. Smith</p>
                            <p className="text-sm text-slate-600">Programming Fundamentals</p>
                            <div className="flex items-center text-sm text-slate-500 mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              Dec 15, 2024 at 10:00 AM
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          Pending
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-10 h-10 text-ustp-navy" />
                          <div>
                            <p className="font-medium text-slate-900">Prof. Johnson</p>
                            <p className="text-sm text-slate-600">Data Structures</p>
                            <div className="flex items-center text-sm text-slate-500 mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              Dec 12, 2024 at 2:00 PM
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Approved
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Class Schedule</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {studentClasses.map((cls) => (
                    <Card key={cls.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-ustp-navy rounded-lg flex items-center justify-center">
                            <Book className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{cls.code}</h4>
                            <p className="text-sm text-slate-600">{cls.name}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {cls.instructor}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {cls.schedule}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
