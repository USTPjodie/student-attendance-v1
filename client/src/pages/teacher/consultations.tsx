import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Plus, Calendar, Clock, User, Check, X, MessageSquare } from "lucide-react";

export default function ConsultationsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: consultations } = useQuery({
    queryKey: ["/api/consultations"],
  });

  const mockConsultations = [
    {
      id: 1,
      student: { name: "Alice Doe", email: "alice.doe@student.ustp.edu.ph" },
      dateTime: "2024-12-15 10:00",
      purpose: "Discussion about midterm grades",
      status: "pending",
    },
    {
      id: 2,
      student: { name: "John Smith", email: "john.smith@student.ustp.edu.ph" },
      dateTime: "2024-12-15 14:00",
      purpose: "Career guidance and course selection",
      status: "approved",
    },
    {
      id: 3,
      student: { name: "Maria Garcia", email: "maria.garcia@student.ustp.edu.ph" },
      dateTime: "2024-12-14 09:00",
      purpose: "Help with programming assignment",
      status: "completed",
    },
  ];

  const filteredConsultations = mockConsultations.filter(c => c.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-600 bg-amber-100";
      case "approved": return "text-green-600 bg-green-100";
      case "completed": return "text-slate-600 bg-slate-100";
      case "rejected": return "text-red-600 bg-red-100";
      default: return "text-slate-600 bg-slate-100";
    }
  };

  const tabs = [
    { id: "pending", label: "Pending", count: mockConsultations.filter(c => c.status === "pending").length },
    { id: "approved", label: "Approved", count: mockConsultations.filter(c => c.status === "approved").length },
    { id: "completed", label: "Completed", count: mockConsultations.filter(c => c.status === "completed").length },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Consultation Management"
          subtitle="Manage student consultation requests and appointments"
          actions={
            <Button className="bg-ustp-navy hover:bg-ustp-navy-light">
              <Plus className="w-4 h-4 mr-2" />
              Set Availability
            </Button>
          }
        />

        <main className="p-6">
          {/* Availability Settings */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-ustp-navy/5 rounded-lg border border-ustp-navy/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-ustp-navy" />
                    <span className="font-medium text-ustp-navy">Monday - Wednesday</span>
                  </div>
                  <p className="text-sm text-slate-600">2:00 PM - 4:00 PM</p>
                </div>
                <div className="p-4 bg-ustp-navy/5 rounded-lg border border-ustp-navy/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-ustp-navy" />
                    <span className="font-medium text-ustp-navy">Friday</span>
                  </div>
                  <p className="text-sm text-slate-600">10:00 AM - 12:00 PM</p>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-600">Duration</span>
                  </div>
                  <p className="text-sm text-slate-600">30 minutes per session</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultation Tabs */}
          <Card>
            <CardContent className="p-6">
              <div className="border-b border-slate-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-ustp-navy text-ustp-navy"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Consultations List */}
              <div className="space-y-4">
                {filteredConsultations.length > 0 ? (
                  filteredConsultations.map((consultation) => (
                    <div key={consultation.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-ustp-navy rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{consultation.student.name}</h4>
                            <p className="text-sm text-slate-600">{consultation.student.email}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(consultation.dateTime).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(consultation.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Purpose:</span>
                              </div>
                              <p className="text-sm text-slate-600">{consultation.purpose}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                            {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                          </span>
                          {consultation.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {consultation.status === "approved" && (
                            <Button size="sm" variant="outline">
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No {activeTab} consultations
                    </h3>
                    <p className="text-slate-600">
                      {activeTab === "pending" 
                        ? "New consultation requests will appear here"
                        : `No ${activeTab} consultations at the moment`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
