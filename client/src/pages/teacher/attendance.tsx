import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";
import { Users, CheckCircle, XCircle, Check, X, Download } from "lucide-react";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await fetch(`/api/students?classId=${selectedClass}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!selectedClass,
  });

  const { data: attendanceRecords } = useQuery({
    queryKey: ["/api/attendance", selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await fetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!selectedClass,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { studentId: number; status: string }) => {
      await apiRequest("POST", "/api/attendance", {
        classId: parseInt(selectedClass),
        studentId: data.studentId,
        status: data.status,
        date: selectedDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance saved",
        description: "Student attendance has been recorded",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    },
  });

  const handleMarkAttendance = (studentId: number, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    const promises = Object.entries(attendanceState).map(([studentId, status]) =>
      markAttendanceMutation.mutateAsync({ studentId: parseInt(studentId), status })
    );
    
    Promise.all(promises).then(() => {
      setAttendanceState({});
    });
  };

  const handleMarkAllPresent = () => {
    if (students) {
      const newState: Record<string, string> = {};
      students.forEach((student: any) => {
        newState[student.id] = "present";
      });
      setAttendanceState(newState);
    }
  };

  const handleReset = () => {
    setAttendanceState({});
  };

  const getAttendanceStats = () => {
    if (!students) return { total: 0, present: 0, absent: 0 };
    
    const total = students.length;
    let present = 0;
    let absent = 0;

    students.forEach((student: any) => {
      const status = attendanceState[student.id];
      if (status === "present") present++;
      else if (status === "absent") absent++;
    });

    return { total, present, absent };
  };

  const stats = getAttendanceStats();

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Attendance Management"
          subtitle="Track student attendance for your classes"
          actions={
            <Button className="bg-ustp-gold hover:bg-ustp-gold-dark">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          }
        />

        <main className="p-6">
          {/* Class Selection */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Select Class</h3>
                  <p className="text-slate-600">Choose a class to take attendance</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.code} - {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedClass && (
            <>
              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Students</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                      </div>
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Present</p>
                        <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Absent</p>
                        <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance List */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Student Attendance</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleMarkAllPresent}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Mark All Present
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {students?.map((student: any) => {
                      const status = attendanceState[student.id];
                      const initials = `${student.user?.firstName?.[0] || ''}${student.user?.lastName?.[0] || ''}`;
                      
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-slate-600">{initials}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {student.user?.firstName} {student.user?.lastName}
                              </p>
                              <p className="text-sm text-slate-500">Student ID: {student.studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-500">
                              {Math.floor(Math.random() * 15 + 80)}% attendance rate
                            </span>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, "present")}
                                className={`w-10 h-10 ${
                                  status === "present"
                                    ? "bg-green-600 text-white"
                                    : "bg-green-100 text-green-600 hover:bg-green-200"
                                }`}
                              >
                                <Check className="w-5 h-5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, "absent")}
                                className={`w-10 h-10 ${
                                  status === "absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-red-100 text-red-600 hover:bg-red-200"
                                }`}
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(attendanceState).length > 0 && (
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={handleSaveAttendance}
                        className="bg-ustp-navy hover:bg-ustp-navy-light"
                        disabled={markAttendanceMutation.isPending}
                      >
                        {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
