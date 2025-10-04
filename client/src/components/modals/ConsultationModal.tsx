import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConsultationSlot {
  id: number;
  teacherId: number;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'pending_approval';
  isActive: boolean;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  subject: string;
}

interface EnrolledClass {
  id: number;
  name: string;
  teacherId: number;
  first_name: string;
  last_name: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId?: number;
  initialData?: {
    teacherId?: number;
    date?: Date;
    purpose?: string;
    notes?: string;
  };
}

export function ConsultationModal({ isOpen, onClose, consultationId, initialData }: ConsultationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState<number | undefined>(initialData?.teacherId);
  const [date, setDate] = useState<Date | undefined>(initialData?.date);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Fetch enrolled classes to get teachers
  const { data: enrolledClasses, isLoading: isLoadingClasses } = useQuery({
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
  const teachers = enrolledClasses?.reduce((acc: Teacher[], curr: EnrolledClass) => {
    // Check if teacher already exists in accumulator
    if (!acc.find((t: Teacher) => t.id === curr.teacherId)) {
      acc.push({
        id: curr.teacherId,
        firstName: curr.first_name,
        lastName: curr.last_name,
        subject: curr.name
      });
    }
    return acc;
  }, []) ?? [];

  // Fetch available slots for selected teacher and date
  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery<TimeSlot[]>({
    queryKey: ["/api/availability", selectedTeacher, date],
    queryFn: async () => {
      if (!selectedTeacher || !date) return [];
      // Format date in Philippine timezone
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Manila'
      };
      const formatter = new Intl.DateTimeFormat('sv-SE', options); // sv-SE uses ISO format
      const dateStr = formatter.format(date);
      const response = await fetch(`/api/availability/${selectedTeacher}/slots?date=${dateStr}`);
      if (!response.ok) {
        throw new Error("Failed to fetch available slots");
      }
      return response.json();
    },
    enabled: !!selectedTeacher && !!date,
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

  // Get booked time slots for the selected date
  const { data: bookedSlots, isLoading: isLoadingBookedSlots } = useQuery<string[]>({
    queryKey: ["/api/consultations/booked-slots", selectedTeacher, date],
    queryFn: async () => {
      if (!selectedTeacher || !date) return [];
      const response = await fetch(
        `/api/consultations/booked-slots?teacherId=${selectedTeacher}&date=${date.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch booked slots");
      }
      return response.json();
    },
    enabled: !!selectedTeacher && !!date,
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

  // Function to style dates in the calendar
  const highlightAvailableDates = (dateToCheck: Date) => {
    if (isDateAvailable(dateToCheck)) {
      return {
        backgroundColor: '#dbeafe', // Light blue background for available dates
        color: '#1e40af', // Dark blue text for available dates
        fontWeight: 'bold',
        borderRadius: '50%',
      };
    }
    return {};
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !purpose || !selectedTeacher || !date) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.startTime + "-" + selectedSlot.endTime,
          purpose,
          notes,
          teacherId: selectedTeacher,
          date: date.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: "Booking created",
        description: "Your consultation request has been submitted successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBookingMutation.mutate();
  };

  if (isLoadingClasses) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Book Consultation</DialogTitle>
          <DialogDescription>
            Select a teacher and available time slot for your consultation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teacher selection */}
          <div className="space-y-2">
            <Label>Select Teacher</Label>
            <Select
              value={selectedTeacher?.toString()}
              onValueChange={(value) => setSelectedTeacher(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher: Teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.firstName} {teacher.lastName} ({teacher.subject})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time slot selection side by side */}
          {selectedTeacher && (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Calendar */}
              <div className="flex-1 space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  weekStartsOn={1} // Start week on Monday
                  // Add modifiers to highlight available dates
                  modifiers={{
                    available: (date) => isDateAvailable(date)
                  }}
                  modifiersStyles={{
                    available: {
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: 'bold',
                    }
                  }}
                  // Disable dates more than 30 days in the future
                  disabled={(date) => {
                    const today = new Date();
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(today.getDate() + 30);
                    return date < today || date > thirtyDaysFromNow;
                  }}
                />
              </div>
              {/* Time Slots */}
              <div className="flex-1 space-y-2">
                <Label>Available Time Slots</Label>
                {date ? (
                  isLoadingSlots || isLoadingBookedSlots ? (
                    <div className="text-muted-foreground">Loading slots...</div>
                  ) : availableSlots && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {availableSlots.map((slot) => {
                        // Ensure consistent time formatting for comparison
                        const slotTime = slot.startTime.slice(0, 5); // Extract HH:MM format
                        const isBooked = bookedSlots && bookedSlots.some((bookedSlot: string) => 
                          bookedSlot.startsWith(slotTime)
                        );
                        return (
                          <Button
                            key={slot.startTime + slot.endTime}
                            variant={selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime ? "default" : "outline"}
                            onClick={() => !isBooked && setSelectedSlot(slot)}
                            disabled={isBooked}
                            className={`w-full ${isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)} {isBooked && "(Booked)"}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No available slots for this date.</div>
                  )
                ) : (
                  <div className="text-muted-foreground">Select a date to see available slots.</div>
                )}
              </div>
            </div>
          )}

          {/* Purpose and notes */}
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

          <DialogFooter>
            <Button type="submit" disabled={createBookingMutation.isPending || !selectedSlot}>
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 