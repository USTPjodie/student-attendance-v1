import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Grade {
  id: number;
  score: number;
  letterGrade: string | null;
  comments: string | null;
  assignment: {
    id: number;
    title: string;
    type: string;
    maxScore: number;
    weight: number;
    class: {
      name: string;
      code: string;
    };
  };
}

interface StudentRecord {
  grades: {
    assignment: {
      id: number;
      title: string;
      type: string;
      maxScore: number;
      weight: number;
      class: {
        name: string;
        code: string;
      };
    };
    grade: Grade;
  }[];
  totalScore: number;
  maxScore: number;
  average: number;
}

export default function StudentRecord() {
  const [, params] = useParams();
  const studentId = Number(params?.studentId);

  const { data: studentRecord } = useQuery({
    queryKey: ["student-records", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/student-records/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch student records");
      return res.json();
    },
  });

  if (!studentRecord) return <div>Loading...</div>;

  // Group grades by class
  const gradesByClass = studentRecord.grades.reduce((acc: Record<string, any[]>, curr) => {
    const classCode = curr.assignment.class.code;
    if (!acc[classCode]) {
      acc[classCode] = [];
    }
    acc[classCode].push(curr);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Student Records</h1>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{studentRecord.totalScore}</p>
              <p className="text-sm text-gray-500">out of {studentRecord.maxScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{studentRecord.average.toFixed(2)}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(gradesByClass).map(([classCode, grades]) => (
          <div key={classCode} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">
              {grades[0].assignment.class.name} ({classCode})
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map(({ assignment, grade }) => (
                  <TableRow key={grade.id}>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>{assignment.type}</TableCell>
                    <TableCell>
                      {grade.score} / {assignment.maxScore}
                    </TableCell>
                    <TableCell>{grade.letterGrade || "-"}</TableCell>
                    <TableCell>{assignment.weight}</TableCell>
                    <TableCell>{grade.comments || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
} 