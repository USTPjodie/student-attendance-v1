import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import { ConsultationModal } from "@/components/modals/ConsultationModal";
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
  X,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DashboardStats {
  attendanceRate: number;
  classCount: number;
  consultations: number;
}

interface Consultation {
  id: number;
  teacherId: number;
  studentId: number;
  dateTime: string;
  duration: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceData {
  attendanceRate: number;
  present: number;
  total: number;
}

interface MockAttendanceData {
  [key: number]: AttendanceData;
}

interface StudentClass {
  id: number;
  code: string;
  name: string;
  teacher_name: string;
  schedule: string;
  room: string;
  semester: string;
  description: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

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

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades", { studentId: user?.student?.id }],
    enabled: !!user?.student?.id,
  });

  const { data: consultations } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
  });

  const { data: updateStatusMutation } = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      fetch(`/api/consultations/${data.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: data.status }),
      }).then((res) => res.json()),
    onSuccess: () => {
      toast({
        title: "Consultation status updated",
        description: "The consultation status has been updated successfully",
      });
      window.location.reload();
    },
  });

  const { data: studentClasses } = useQuery<StudentClass[]>({
    queryKey: ["/api/student/classes"],
    queryFn: async () => {
      const response = await fetch("/api/student/classes");
      if (!response.ok) {
        throw new Error("Failed to fetch enrolled classes");
      }
      return response.json();
    },
  });

  // Mock student classes with attendance data
  const mockAttendanceData: MockAttendanceData = {
    1: { attendanceRate: 95, present: 19, total: 20 },
    2: { attendanceRate: 88, present: 15, total: 17 },
    3: { attendanceRate: 75, present: 12, total: 16 },
    4: { attendanceRate: 82, present: 14, total: 17 },
  };

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

  const getStatusColor = (status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-800";
  };

  if (!studentClasses) {
    return <div>Loading...</div>;
  }

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
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="consultations">Consultations</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="attendance">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Class Attendance</h3>
                  <div className="space-y-4">
                    {studentClasses.map((cls: StudentClass) => (
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
                                {cls.teacher_name} • {cls.schedule}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${getAttendanceColor(mockAttendanceData[cls.id]?.attendanceRate || 0)}`}>
                              {mockAttendanceData[cls.id]?.attendanceRate || 0}%
                            </p>
                            <p className="text-sm text-slate-500">
                              {mockAttendanceData[cls.id]?.present || 0}/{mockAttendanceData[cls.id]?.total || 0} present
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                            <span>Attendance Progress</span>
                            <span>{mockAttendanceData[cls.id]?.present || 0}/{mockAttendanceData[cls.id]?.total || 0} classes</span>
                          </div>
                          <Progress value={mockAttendanceData[cls.id]?.attendanceRate || 0} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grades">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Grades</h3>
                  <p className="text-slate-600">No grades available yet.</p>
                </div>
              </TabsContent>

              <TabsContent value="consultations">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Consultations</h3>
                    <Button onClick={() => setIsConsultationModalOpen(true)}>
                      Book New Consultation
                    </Button>
                  </div>
                  <p className="text-slate-600">No consultations scheduled yet.</p>
                </div>
              </TabsContent>

              <TabsContent value="schedule">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Class Schedule</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {studentClasses.map((cls: StudentClass) => (
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
                              {cls.teacher_name}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {cls.schedule}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {cls.room}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <ConsultationModal 
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
      />
    </div>
  );
}
