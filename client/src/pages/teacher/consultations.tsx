import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Calendar, Clock, User, Check, X, MessageSquare, Loader2, Pencil } from "lucide-react";
import { AvailabilityModal } from "@/components/modals/AvailabilityModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Student {
  id: number;
  userId: number;
  studentId: string;
  firstName: string;
  lastName: string;
  year: number;
  program: string;
  gpa?: number;
}

interface Consultation {
  id: number;
  studentId: number;
  teacherId: number;
  dateTime: string;
  duration: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  student?: Student;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default function ConsultationsScreen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  const { data: consultations, isLoading: isLoadingConsultations } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    queryFn: async () => {
      const response = await fetch("/api/consultations");
      if (!response.ok) {
        throw new Error("Failed to fetch consultations");
      }
      const data = await response.json();
      console.log('Consultations data:', data);
      return data;
    },
  });

  const { data: availability, isLoading: isLoadingAvailability } = useQuery<TimeSlot[]>({
    queryKey: ["/api/availability"],
    queryFn: async () => {
      const response = await fetch("/api/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Consultation["status"] }) => {
      const response = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update consultation status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      toast({
        title: "Status updated",
        description: "The consultation status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (timeSlots: TimeSlot[]) => {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlots }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update availability");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Availability updated",
        description: "Your availability has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: Consultation["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingConsultations = consultations?.filter((c) => c.status === "pending") ?? [];
  const approvedConsultations = consultations?.filter((c) => c.status === "approved") ?? [];
  const completedConsultations = consultations?.filter((c) => c.status === "completed") ?? [];
  const cancelledConsultations = consultations?.filter((c) => c.status === "cancelled") ?? [];

  if (isLoadingConsultations || isLoadingAvailability) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Consultation Management"
          subtitle="Manage student consultation requests and appointments"
          actions={
            <Button 
              className="bg-primary hover:bg-primary-dark text-background-light"
              onClick={() => setIsAvailabilityModalOpen(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Set Availability
            </Button>
          }
        />

        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Your Availability Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availability?.map((slot, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium capitalize">{slot.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!availability || availability.length === 0) && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground">No availability set. Click "Set Availability" to add your schedule.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingConsultations.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedConsultations.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedConsultations.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledConsultations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="w-10 h-10 text-primary" />
                        <div>
                          <p className="font-medium">
                            {consultation.student?.firstName} {consultation.student?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {(() => {
                              console.log('Date value:', consultation.dateTime);
                              if (!consultation.dateTime) return "No date set";
                              try {
                                const date = new Date(consultation.dateTime);
                                console.log('Parsed date:', date);
                                return format(date, "PPP p");
                              } catch (error) {
                                console.error('Date parsing error:', error);
                                return "Invalid date";
                              }
                            })()}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: "approved" })}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: "rejected" })}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="w-10 h-10 text-primary" />
                        <div>
                          <p className="font-medium">
                            {consultation.student?.firstName} {consultation.student?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {(() => {
                              console.log('Date value:', consultation.dateTime);
                              if (!consultation.dateTime) return "No date set";
                              try {
                                const date = new Date(consultation.dateTime);
                                console.log('Parsed date:', date);
                                return format(date, "PPP p");
                              } catch (error) {
                                console.error('Date parsing error:', error);
                                return "Invalid date";
                              }
                            })()}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: "completed" })}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: "cancelled" })}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          {consultation.student?.firstName} {consultation.student?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {(() => {
                            console.log('Date value:', consultation.dateTime);
                            if (!consultation.dateTime) return "No date set";
                            try {
                              const date = new Date(consultation.dateTime);
                              console.log('Parsed date:', date);
                              return format(date, "PPP p");
                            } catch (error) {
                              console.error('Date parsing error:', error);
                              return "Invalid date";
                            }
                          })()}
                        </div>
                        {consultation.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notes: {consultation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          {consultation.student?.firstName} {consultation.student?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {(() => {
                            console.log('Date value:', consultation.dateTime);
                            if (!consultation.dateTime) return "No date set";
                            try {
                              const date = new Date(consultation.dateTime);
                              console.log('Parsed date:', date);
                              return format(date, "PPP p");
                            } catch (error) {
                              console.error('Date parsing error:', error);
                              return "Invalid date";
                            }
                          })()}
                        </div>
                        {consultation.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notes: {consultation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        currentAvailability={availability || []}
        onSave={updateAvailabilityMutation.mutate}
      />
    </div>
  );
}
