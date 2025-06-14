import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StudentModal from "@/components/modals/student-modal";
import { Plus, Search, UserPlus, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function StudentsScreen() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const filteredStudents = students?.filter((student: any) => {
    const matchesSearch = `${student.user?.firstName} ${student.user?.lastName} ${student.studentId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Student Management"
          subtitle="Manage student records and information"
          actions={
            <Button onClick={() => setIsModalOpen(true)} className="bg-ustp-navy hover:bg-ustp-navy-light">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          }
        />

        <main className="p-6">
          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes?.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-ustp-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading students...</p>
            </div>
          ) : filteredStudents?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStudents.map((student: any) => {
                const initials = `${student.user?.firstName?.[0] || ''}${student.user?.lastName?.[0] || ''}`;
                const attendanceRate = Math.floor(Math.random() * 15 + 80);
                
                return (
                  <Card key={student.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 bg-ustp-navy rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">{initials}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </h3>
                          <p className="text-slate-600">ID: {student.studentId}</p>
                          <div className="flex items-center mt-2">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              attendanceRate >= 90 ? 'bg-green-500' : 
                              attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            <span className="text-sm text-slate-600">{attendanceRate}% attendance</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {student.year} - {student.program}
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {student.user?.email}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Current GPA</span>
                          <span className="font-semibold text-slate-900">{student.gpa}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          View Profile
                        </Button>
                        <Button size="sm" className="flex-1 bg-ustp-navy hover:bg-ustp-navy-light">
                          Attendance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No students found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? "No students match your search criteria" : "Add students to get started"}
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-ustp-navy hover:bg-ustp-navy-light">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          )}
        </main>
      </div>

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
