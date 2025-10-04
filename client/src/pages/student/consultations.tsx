import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Calendar, Clock, User, Loader2, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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

  // Get available time slots for the selected teacher and date
  const { data: availableTimeSlots, isLoading: isLoadingSlots } = useQuery<TimeSlot[]>({
    queryKey: ["/api/availability", selectedTeacher, selectedDate],
    queryFn: async () => {
      if (!selectedTeacher || !selectedDate) return [];
      // Format date in Philippine timezone
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Manila'
      };
      const formatter = new Intl.DateTimeFormat('sv-SE', options); // sv-SE uses ISO format
      const dateStr = formatter.format(selectedDate);
      const response = await fetch(
        `/api/availability/${selectedTeacher}/slots?date=${dateStr}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch available time slots");
      }
      return response.json();
    },
    enabled: !!selectedTeacher && !!selectedDate,
  });

  // Fetch teacher's overall availability to highlight dates in the calendar
  const { data: teacherAvailability } = useQuery<TimeSlot[]>({
    queryKey: ["/api/availability", selectedTeacher],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      const response = await fetch(`/api/availability/${selectedTeacher}`);
      if (!response.ok) {
        throw new Error("Failed to fetch teacher availability");
      }
      return response.json();
    },
    enabled: !!selectedTeacher,
  });

  // Function to determine if a date has teacher availability
  const isDateAvailable = (dateToCheck: Date) => {
    if (!teacherAvailability || teacherAvailability.length === 0) return false;
    
    // Use Philippine timezone to avoid timezone conflicts
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'Asia/Manila' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const dayName = formatter.format(dateToCheck);
    
    return teacherAvailability.some(slot => slot.day === dayName);
  };

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

  // Generate 30-minute slots from available time ranges
  const timeSlots = useMemo(() => {
    if (!availableTimeSlots) return [];
    
    const slots: string[] = [];
    availableTimeSlots.forEach(slot => {
      let currentTime = new Date(`2000-01-01T${slot.startTime}`);
      const endTime = new Date(`2000-01-01T${slot.endTime}`);
      
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        slots.push(timeString);
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
    });
    
    return slots.sort();
  }, [availableTimeSlots]);

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

  // Helper function to format dates in Philippine timezone
  const formatPhilippineDate = (date: Date, formatString: string) => {
    // For "PPP p" format, we'll manually format
    if (formatString === "PPP p") {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Asia/Manila'
      };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    }
    
    // For "MMM d, yyyy h:mm a" format
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Manila'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
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
          <div className="grid gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{pendingConsultations.length}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{approvedConsultations.length}</p>
                    <p className="text-sm text-green-600">Approved</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{completedConsultations.length}</p>
                    <p className="text-sm text-blue-600">Completed</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{cancelledConsultations.length}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <span>Pending</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {pendingConsultations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <span>Approved</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {approvedConsultations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <span>Completed</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {completedConsultations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <span>Cancelled</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {cancelledConsultations.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingConsultations
                .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg">
                              {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                            </p>
                            <Badge variant="outline" className={getStatusColor(consultation.status)}>
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {consultation.dateTime ? formatPhilippineDate(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedConsultations
                .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg">
                              {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                            </p>
                            <Badge variant="outline" className={getStatusColor(consultation.status)}>
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {consultation.dateTime ? formatPhilippineDate(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedConsultations
                .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg">
                              {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                            </p>
                            <Badge variant="outline" className={getStatusColor(consultation.status)}>
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {consultation.dateTime ? formatPhilippineDate(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledConsultations
                .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg">
                              {consultation.teacher?.firstName} {consultation.teacher?.lastName}
                            </p>
                            <Badge variant="outline" className={getStatusColor(consultation.status)}>
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{consultation.purpose}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {consultation.dateTime ? formatPhilippineDate(new Date(consultation.dateTime.replace(' ', 'T')), "PPP p") : "No date set"}
                          </div>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Teacher Schedules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{teacher.firstName} {teacher.lastName}</span>
                      <Badge variant="outline">{teacher.subject}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                        const daySlots = availableTimeSlots?.filter(slot => slot.day === day) || [];
                        return daySlots.length > 0 ? (
                          <div key={day} className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium capitalize">{day}:</span>
                            <span className="text-sm text-muted-foreground">
                              {daySlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
                            </span>
                          </div>
                        ) : null;
                      })}
                      {(!availableTimeSlots || availableTimeSlots.length === 0) && (
                        <p className="text-sm text-muted-foreground">No consultation hours set</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Book Consultation</DialogTitle>
              <DialogDescription>
                Select a teacher and available time slot for your consultation.
              </DialogDescription>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select
                    value={selectedTeacher?.toString()}
                    onValueChange={(value) => setSelectedTeacher(Number(value))}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) => setSelectedDate(date)}
                      className="rounded-md border"
                      weekStartsOn={1} // Start week on Monday
                      // Add modifiers to highlight available dates
                      modifiers={{
                        available: (date: Date) => isDateAvailable(date)
                      }}
                      modifiersStyles={{
                        available: {
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: 'bold',
                        }
                      }}
                      // Disable dates more than 30 days in the future
                      disabled={(date: Date) => {
                        const today = new Date();
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(today.getDate() + 30);
                        return date < today || date > thirtyDaysFromNow;
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                      {isLoadingSlots ? (
                        <div className="col-span-2 flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : timeSlots.length > 0 ? (
                        timeSlots.map((time) => {
                          // Ensure consistent time formatting for comparison
                          const isBooked = bookedSlots && bookedSlots.some((bookedSlot: string) => 
                            bookedSlot.startsWith(time)
                          );
                          return (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTimeSlot === time ? "default" : "outline"}
                              onClick={() => !isBooked && setSelectedTimeSlot(time)}
                              disabled={isBooked}
                              className={`w-full ${isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {time} {isBooked && "(Booked)"}
                            </Button>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center text-muted-foreground py-4">
                          {selectedDate ? "No available slots for this date" : "Select a date to see available slots"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="What would you like to discuss?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information you'd like to share"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={!selectedTimeSlot || !purpose}>
                  {bookConsultationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Book Consultation"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 