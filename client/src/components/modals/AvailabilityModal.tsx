import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

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

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function AvailabilityModal({
  isOpen,
  onClose,
  currentAvailability,
  onSave,
}: AvailabilityModalProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(currentAvailability);

  const handleAddTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      { day: "Monday", startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleTimeSlotChange = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setTimeSlots(newTimeSlots);
  };

  const handleSave = () => {
    onSave(timeSlots);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Set Your Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-end space-x-4">
              <div className="flex-1">
                <Label>Day</Label>
                <Select
                  value={slot.day}
                  onValueChange={(value) =>
                    handleTimeSlotChange(index, "day", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    handleTimeSlotChange(index, "startTime", e.target.value)
                  }
                />
              </div>

              <div className="flex-1">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    handleTimeSlotChange(index, "endTime", e.target.value)
                  }
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveTimeSlot(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddTimeSlot}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Time Slot
          </Button>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 