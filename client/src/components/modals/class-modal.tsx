import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass?: any;
}

export default function ClassModal({ isOpen, onClose, editingClass }: ClassModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    room: "",
    maxStudents: 35,
    schedule: "",
    semester: "",
    description: "",
  });

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name || "",
        code: editingClass.code || "",
        room: editingClass.room || "",
        maxStudents: editingClass.maxStudents || 35,
        schedule: editingClass.schedule || "",
        semester: editingClass.semester || "",
        description: editingClass.description || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        room: "",
        maxStudents: 35,
        schedule: "",
        semester: "",
        description: "",
      });
    }
  }, [editingClass, isOpen]);

  const createClassMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: `Class ${editingClass ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save class",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingClass ? "Edit Class" : "Add New Class"}
          </DialogTitle>
          <DialogDescription>
            {editingClass ? "Update class information" : "Create a new class for your course"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                placeholder="e.g., Programming Fundamentals"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Class Code</Label>
              <Input
                id="code"
                placeholder="e.g., CS 101"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                placeholder="e.g., Room 204"
                value={formData.room}
                onChange={(e) => handleChange("room", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                placeholder="35"
                value={formData.maxStudents}
                onChange={(e) => handleChange("maxStudents", parseInt(e.target.value) || 35)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="schedule">Schedule</Label>
            <Input
              id="schedule"
              placeholder="e.g., MWF 9:00-10:30 AM"
              value={formData.schedule}
              onChange={(e) => handleChange("schedule", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="semester">Semester</Label>
            <Select value={formData.semester} onValueChange={(value) => handleChange("semester", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                <SelectItem value="Summer 2024">Summer 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the class..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ustp-navy hover:bg-ustp-navy-light"
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending 
                ? "Saving..." 
                : editingClass 
                  ? "Update Class" 
                  : "Create Class"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
