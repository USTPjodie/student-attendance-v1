import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Calendar, Clock, User, Loader2, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  subject: string;
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

interface EnrolledClass {
  id: number;
  name: string;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export default function StudentConsultationsScreen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch enrolled classes to get teachers
  const { data: enrolledClasses, isLoading: isLoadingClasses } = useQuery<EnrolledClass[]>({
    queryKey: ["/api/student/classes"],
    queryFn: async () => {
      const response = await fetch("/api/student/classes");
      if (!response.ok) {
        throw new Error("Failed to fetch enrolled classes");
      }
      return response.json();
    },
  });

  // Get unique teachers from enrolled classes
  const teachers = enrolledClasses?.reduce((acc, curr) => {
    if (!acc.find(t => t.id === curr.teacher.id)) {
      acc.push({
        id: curr.teacher.id,
        firstName: curr.teacher.firstName,
        lastName: curr.teacher.lastName,
        subject: curr.name
      });
    }
    return acc;
  }, [] as Teacher[]) ?? [];

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

  const { data: availableTimeSlots, isLoading: isLoadingSlots } = useQuery<TimeSlot[]>({
    queryKey: ["/api/teacher-availability", selectedTeacher, selectedDate],
    queryFn: async () => {
      if (!selectedTeacher || !selectedDate) return [];
      const response = await fetch(
        `/api/teacher-availability/${selectedTeacher}?date=${selectedDate.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch available time slots");
      }
      return response.json();
    },
    enabled: !!selectedTeacher && !!selectedDate,
  });

  // Get booked time slots for the selected date
  const { data: bookedSlots, isLoading: isLoadingBookedSlots } = useQuery<string[]>({
    queryKey: ["/api/consultations/booked-slots", selectedTeacher, selectedDate],
    queryFn: async () => {
      if (!selectedTeacher || !selectedDate) return [];
      const response = await fetch(
        `/api/consultations/booked-slots?teacherId=${selectedTeacher}&date=${selectedDate.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch booked slots");
      }
      return response.json();
    },
    enabled: !!selectedTeacher && !!selectedDate,
  });

  // Generate 30-minute slots within the available time range, excluding booked slots
  const timeSlots = availableTimeSlots?.flatMap(slot => {
    const slots: string[] = [];
    let currentTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(`2000-01-01T${slot.endTime}`);

    while (currentTime < endTime) {
      const timeString = format(currentTime, "HH:mm");
      if (!bookedSlots?.includes(timeString)) {
        slots.push(timeString);
      }
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }) || [];

  const bookConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeacher || !selectedDate || !selectedTimeSlot || !purpose) {
        throw new Error("Please fill in all required fields");
      }

      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(":").map(Number);
      dateTime.setHours(hours, minutes);

      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          dateTime: dateTime.toISOString(),
          purpose,
          duration: 30,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book consultation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      toast({
        title: "Consultation booked",
        description: "Your consultation has been booked successfully.",
      });
      setIsBookingModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedTeacher(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setPurpose("");
    setNotes("");
  };

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

  if (isLoadingConsultations || isLoadingClasses) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!enrolledClasses || enrolledClasses.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar user={user} />
        <div className="flex-1 overflow-y-auto">
          <Header
            title="Consultations"
            subtitle="Book and manage your consultations"
          />
          <main className="p-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                You are not enrolled in any classes yet. Please contact your administrator.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Consultations"
          subtitle="Book and manage your consultations"
          actions={
            <Button 
              className="bg-primary hover:bg-primary-dark text-background-light"
              onClick={() => setIsBookingModalOpen(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
          }
        />

        <main className="p-6">
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p>Debug Info:</p>
            <p>Modal Open: {isBookingModalOpen ? 'Yes' : 'No'}</p>
            <p>Selected Teacher: {selectedTeacher || 'None'}</p>
            <p>Selected Date: {selectedDate ? selectedDate.toISOString() : 'None'}</p>
            <p>Selected Time: {selectedTimeSlot || 'None'}</p>
            <p>Purpose: {purpose || 'None'}</p>
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
                    <div className="flex items-center space-x-3">
                      <User className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {consultation.dateTime ? format(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
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

            <TabsContent value="approved" className="space-y-4">
              {approvedConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {consultation.dateTime ? format(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
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

            <TabsContent value="completed" className="space-y-4">
              {completedConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {consultation.dateTime ? format(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
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
                          {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{consultation.purpose}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {consultation.dateTime ? format(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
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

        <Dialog 
          open={isBookingModalOpen} 
          onOpenChange={(open) => {
            setIsBookingModalOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book Consultation</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!selectedTeacher || !selectedDate || !selectedTimeSlot || !purpose) {
                toast({
                  title: "Error",
                  description: "Please fill in all required fields",
                  variant: "destructive",
                });
                return;
              }
              bookConsultationMutation.mutate();
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select
                    value={selectedTeacher?.toString()}
                    onValueChange={(value) => {
                      setSelectedTeacher(Number(value));
                      setSelectedDate(undefined);
                      setSelectedTimeSlot(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.firstName} {teacher.lastName} - {teacher.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setSelectedDate(date);
                      setSelectedTimeSlot(null);
                    }}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {selectedDate && (
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time Slot</Label>
                    <Select
                      value={selectedTimeSlot || ""}
                      onValueChange={setSelectedTimeSlot}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.length > 0 ? (
                          timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No available time slots
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter the purpose of your consultation"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={bookConsultationMutation.isPending}
                >
                  {bookConsultationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Book Consultation"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 