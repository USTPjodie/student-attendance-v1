import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addMinutes, parse, isWithinInterval } from "date-fns";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId?: number;
  initialData?: {
    dateTime?: Date;
    purpose?: string;
    duration?: number;
    notes?: string;
  };
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export function ConsultationModal({ isOpen, onClose, consultationId, initialData }: ConsultationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>(initialData?.dateTime);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Fetch teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers");
      if (!response.ok) throw new Error("Failed to fetch teachers");
      return response.json();
    },
  });

  // Fetch available time slots for selected teacher and date
  const { data: availableTimeSlots } = useQuery<TimeSlot[]>({
    queryKey: ["/api/teacher-availability", selectedTeacher, date],
    queryFn: async () => {
      if (!selectedTeacher || !date) return [];
      const response = await fetch(`/api/teacher-availability/${selectedTeacher}?date=${date.toISOString()}`);
      if (!response.ok) throw new Error("Failed to fetch available time slots");
      return response.json();
    },
    enabled: !!selectedTeacher && !!date,
  });

  // Generate 30-minute slots within the available time range
  const timeSlots = availableTimeSlots?.flatMap(slot => {
    const slots: string[] = [];
    let currentTime = parse(slot.startTime, "HH:mm", new Date());
    const endTime = parse(slot.endTime, "HH:mm", new Date());

    while (currentTime < endTime) {
      slots.push(format(currentTime, "HH:mm"));
      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }) || [];

  const createConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeacher || !date || !selectedTimeSlot || !purpose) {
        throw new Error("Please fill in all required fields");
      }

      const dateTime = new Date(date);
      const [hours, minutes] = selectedTimeSlot.split(":").map(Number);
      dateTime.setHours(hours, minutes);

      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          dateTime,
          purpose,
          duration: 30, // Fixed 30-minute duration
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create consultation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      toast({
        title: "Consultation scheduled",
        description: "The consultation has been scheduled successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule consultation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createConsultationMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Consultation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={selectedTeacher?.toString()}
                onValueChange={(value) => setSelectedTeacher(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
            {date && timeSlots.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="time">Available Time Slots</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTimeSlot === slot ? "default" : "outline"}
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter the purpose of the consultation"
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
          <DialogFooter>
            <Button type="submit" disabled={!selectedTeacher || !date || !selectedTimeSlot || !purpose}>
              Schedule Consultation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 