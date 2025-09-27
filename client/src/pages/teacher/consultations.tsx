import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ConsultationModal } from "@/components/modals/ConsultationModal";
import { AvailabilityModal } from "@/components/modals/AvailabilityModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Consultation {
  id: number;
  teacherId: number;
  studentId: number;
  dateTime: string;
  duration: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes: string;
  student: {
    firstName: string;
    lastName: string;
  };
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
      return response.json();
    },
  });

  const { data: availability, isLoading: isLoadingAvailability } = useQuery<TimeSlot[]>({
    queryKey: ["/api/availability"],
    queryFn: async () => {
      const response = await fetch("/api/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      const data = await response.json();
      return data;
    },
  });

  // Group consultations by status
  const consultationsByStatus = (consultations || []).reduce((acc, consultation) => {
    (acc[consultation.status] = acc[consultation.status] || []).push(consultation);
    return acc;
  }, {} as Record<string, Consultation[]>);

  const statusTabs = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, teacherNotes }: { bookingId: number; status: 'approved' | 'rejected'; teacherNotes?: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, teacherNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
      toast({
        title: 'Status updated',
        description: 'The consultation status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // New mutation for updating consultation status (completed/cancelled)
  const updateConsultationStatusMutation = useMutation({
    mutationFn: async ({ consultationId, status }: { consultationId: number; status: 'completed' | 'cancelled' }) => {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update consultation status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
      toast({
        title: 'Status updated',
        description: 'The consultation status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status. Please try again.',
        variant: 'destructive',
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
        throw new Error("Failed to update availability");
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

        {/* Teacher Availability Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Set Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAvailability ? (
              <div className="text-muted-foreground">Loading availability...</div>
            ) : (availability && availability.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availability.map((slot, idx) => (
                  <div key={idx} className="px-3 py-1 rounded bg-primary/10 text-primary text-sm border border-primary/20">
                    {slot.day}: {slot.startTime} - {slot.endTime}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No availability set.</div>
            ))}
          </CardContent>
        </Card>

        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Your Consultation Schedule</h2>
            <Tabs defaultValue="pending" className="w-full mb-6">
              <TabsList className="mb-4">
                {statusTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {statusTabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(consultationsByStatus[tab.value] || []).length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-8">No {tab.label.toLowerCase()} consultations.</div>
                    ) : (
                      consultationsByStatus[tab.value].map((consultation) => (
                        <Card key={consultation.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Calendar className="w-5 h-5 text-primary" />
                              <span>{new Date(consultation.dateTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {consultation.student.firstName} {consultation.student.lastName}
                                  </span>
                                  <Badge variant={
                                    consultation.status === 'approved' ? 'default' :
                                    consultation.status === 'pending' ? 'secondary' :
                                    consultation.status === 'rejected' ? 'destructive' :
                                    consultation.status === 'completed' ? 'outline' :
                                    consultation.status === 'cancelled' ? 'outline' :
                                    'outline'
                                  }>
                                    {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground mb-2">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(consultation.dateTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <p className="text-sm mb-2">{consultation.purpose}</p>
                                {consultation.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateBookingStatusMutation.mutate({
                                        bookingId: consultation.id,
                                        status: 'approved'
                                      })}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateBookingStatusMutation.mutate({
                                        bookingId: consultation.id,
                                        status: 'rejected'
                                      })}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                                {consultation.status === 'completed' && (
                                  <div className="mt-2 text-green-700 text-xs font-semibold">Consultation completed</div>
                                )}
                                {consultation.status === 'cancelled' && (
                                  <div className="mt-2 text-yellow-700 text-xs font-semibold">Consultation cancelled</div>
                                )}
                                {consultation.status === 'rejected' && (
                                  <div className="mt-2 text-red-700 text-xs font-semibold">Consultation rejected</div>
                                )}
                                {consultation.status === 'approved' && (
                                  <div className="mt-2">
                                    {/* Check if the consultation time has passed */}
                                    {new Date(consultation.dateTime) < new Date() ? (
                                      // Show Complete and Cancel buttons for past consultations
                                      <div className="flex space-x-2">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => updateConsultationStatusMutation.mutate({
                                            consultationId: consultation.id,
                                            status: 'completed'
                                          })}
                                        >
                                          Complete
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => updateConsultationStatusMutation.mutate({
                                            consultationId: consultation.id,
                                            status: 'cancelled'
                                          })}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      // Show "Consultation approved" message for future consultations
                                      <div className="text-blue-700 text-xs font-semibold">Consultation approved</div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
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




