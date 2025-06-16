import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface Assignment {
  id: number;
  title: string;
  type: string;
  maxScore: number;
  weight: number;
  dueDate: string;
}

interface Grade {
  id: number;
  score: number;
  letterGrade: string | null;
  comments: string | null;
  student: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface StudentRecord {
  student: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  grades: Grade[];
  totalScore: number;
  maxScore: number;
  average: number;
}

export default function ClassRecord() {
  const [, params] = useParams();
  const classId = Number(params?.classId);
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAddingGrade, setIsAddingGrade] = useState(false);

  const { data: assignments } = useQuery({
    queryKey: ["assignments", classId],
    queryFn: async () => {
      const res = await fetch(`/api/assignments?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const { data: classRecords } = useQuery({
    queryKey: ["class-records", classId],
    queryFn: async () => {
      const res = await fetch(`/api/class-records/${classId}`);
      if (!res.ok) throw new Error("Failed to fetch class records");
      return res.json();
    },
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: Omit<Assignment, "id">) => {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, classId }),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", classId] });
      toast({ title: "Assignment created successfully" });
    },
  });

  const addGradeMutation = useMutation({
    mutationFn: async (data: { studentId: number; score: number; comments?: string }) => {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          assignmentId: selectedAssignment?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to add grade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-records", classId] });
      setIsAddingGrade(false);
      toast({ title: "Grade added successfully" });
    },
  });

  if (!assignments || !classRecords) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Class Records</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Assignment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Assignment</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addAssignmentMutation.mutate({
                  title: formData.get("title") as string,
                  type: formData.get("type") as string,
                  maxScore: Number(formData.get("maxScore")),
                  weight: Number(formData.get("weight")),
                  dueDate: formData.get("dueDate") as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" name="type" required />
              </div>
              <div>
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input id="maxScore" name="maxScore" type="number" required />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input id="weight" name="weight" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="datetime-local" required />
              </div>
              <Button type="submit">Create Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {assignments.map((assignment: Assignment) => (
          <div key={assignment.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{assignment.title}</h2>
                <p className="text-sm text-gray-500">
                  {assignment.type} • Max Score: {assignment.maxScore} • Weight: {assignment.weight}
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setIsAddingGrade(true);
                }}
              >
                Add Grades
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classRecords.studentRecords.map((record: StudentRecord) => {
                  const grade = record.grades.find((g) => g.assignmentId === assignment.id);
                  return (
                    <TableRow key={record.student.id}>
                      <TableCell>
                        {record.student.user.firstName} {record.student.user.lastName}
                      </TableCell>
                      <TableCell>{grade?.score || "-"}</TableCell>
                      <TableCell>{grade?.letterGrade || "-"}</TableCell>
                      <TableCell>{grade?.comments || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>

      {isAddingGrade && selectedAssignment && (
        <Dialog open onOpenChange={setIsAddingGrade}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Grades for {selectedAssignment.title}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addGradeMutation.mutate({
                  studentId: Number(formData.get("studentId")),
                  score: Number(formData.get("score")),
                  comments: formData.get("comments") as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="studentId">Student</Label>
                <select
                  id="studentId"
                  name="studentId"
                  className="w-full p-2 border rounded"
                  required
                >
                  {classRecords.studentRecords.map((record: StudentRecord) => (
                    <option key={record.student.id} value={record.student.id}>
                      {record.student.user.firstName} {record.student.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  max={selectedAssignment.maxScore}
                  required
                />
              </div>
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Input id="comments" name="comments" />
              </div>
              <Button type="submit">Add Grade</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 