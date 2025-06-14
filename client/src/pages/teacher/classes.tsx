import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ClassModal from "@/components/modals/class-modal";
import { Plus, Users, MapPin, Clock, Edit, Trash2 } from "lucide-react";

export default function ClassesScreen() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  const handleEditClass = (cls: any) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Class Management"
          subtitle="Manage your classes and schedules"
          actions={
            <Button onClick={handleAddClass} className="bg-ustp-navy hover:bg-ustp-navy-light">
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          }
        />

        <main className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-ustp-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading classes...</p>
            </div>
          ) : classes?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {classes.map((cls: any) => (
                <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {cls.code}
                        </h3>
                        <p className="text-slate-600 mb-2">{cls.name}</p>
                        <span className="inline-block px-2 py-1 bg-ustp-navy/10 text-ustp-navy text-xs rounded-full">
                          {cls.semester}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClass(cls)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {cls.schedule || "Schedule TBD"}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {cls.room || "Room TBD"}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="w-4 h-4 mr-2" />
                        {Math.floor(Math.random() * 25 + 15)}/{cls.maxStudents || 35} students
                      </div>
                    </div>

                    {cls.description && (
                      <p className="text-sm text-slate-500 mt-4 line-clamp-2">
                        {cls.description}
                      </p>
                    )}

                    <div className="mt-6 flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Students
                      </Button>
                      <Button size="sm" className="flex-1 bg-ustp-navy hover:bg-ustp-navy-light">
                        Take Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No classes yet</h3>
              <p className="text-slate-600 mb-6">Create your first class to get started</p>
              <Button onClick={handleAddClass} className="bg-ustp-navy hover:bg-ustp-navy-light">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Class
              </Button>
            </div>
          )}
        </main>
      </div>

      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingClass={editingClass}
      />
    </div>
  );
}
