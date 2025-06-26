import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvailability: TimeSlot[];
  onSave: (timeSlots: TimeSlot[]) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export function AvailabilityModal({
  isOpen,
  onClose,
  currentAvailability,
  onSave,
}: AvailabilityModalProps) {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(currentAvailability);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const handleAddTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const newTimeSlot: TimeSlot = {
      day: selectedDay,
      startTime,
      endTime,
    };

    setTimeSlots([...timeSlots, newTimeSlot]);
    setSelectedDay("");
    setStartTime("");
    setEndTime("");
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (timeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot",
        variant: "destructive",
      });
      return;
    }

    onSave(timeSlots);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Set Consultation Availability</DialogTitle>
          <DialogDescription>
            Add your available consultation hours for each day of the week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new time slot */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAddTimeSlot} className="w-full">
            Add Time Slot
          </Button>

          {/* Display current time slots */}
          <div className="space-y-2">
            <Label>Current Availability</Label>
            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span>
                    {slot.day}: {slot.startTime} - {slot.endTime}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTimeSlot(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 