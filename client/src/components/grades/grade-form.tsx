import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const gradeFormSchema = z.object({
  courseAssignmentId: z.coerce.number(),
  assignmentName: z.string().min(1, "Assignment name is required"),
  maxScore: z.coerce.number().min(1, "Maximum score must be at least 1"),
  weight: z.coerce.number().min(1, "Weight must be at least 1").max(100, "Weight cannot exceed 100"),
  enrollmentGrades: z.array(
    z.object({
      enrollmentId: z.number(),
      score: z.coerce.number().min(0, "Score cannot be negative"),
    })
  ),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  onSuccess?: () => void;
}

export function GradeForm({ onSuccess }: GradeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Get faculty ID if user is faculty
  const { data: facultyData } = useQuery({
    queryKey: ["/api/faculty"],
    queryFn: async () => {
      if (user?.role !== "faculty") return null;
      const response = await apiRequest("GET", "/api/faculty");
      const facultyList = await response.json();
      const currentFaculty = facultyList.find((f: any) => f.user.id === user.id);
      return currentFaculty;
    },
    enabled: user?.role === "faculty",
  });

  // Fetch course assignments
  const { data: courseAssignments, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/course-assignments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/course-assignments");
      const assignments = await response.json();
      
      // If faculty, filter to only show their assignments
      if (user?.role === "faculty" && facultyData) {
        return assignments.filter((a: any) => a.facultyId === facultyData.id);
      }
      return assignments;
    },
    enabled: !!(user && (user.role === "admin" || (user.role === "faculty" && facultyData))),
  });

  // Fetch enrollments when a course assignment is selected
  useEffect(() => {
    if (selectedCourseAssignment) {
      const fetchEnrollments = async () => {
        try {
          const response = await apiRequest("GET", `/api/enrollments/course/${selectedCourseAssignment}`);
          const enrollmentsData = await response.json();
          setEnrollments(enrollmentsData);
        } catch (error) {
          console.error("Failed to fetch enrollments:", error);
          toast({
            title: "Error",
            description: "Failed to fetch student enrollments",
            variant: "destructive",
          });
        }
      };

      fetchEnrollments();
    }
  }, [selectedCourseAssignment, toast]);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      courseAssignmentId: 0,
      assignmentName: "",
      maxScore: 100,
      weight: 10,
      enrollmentGrades: [],
    },
  });

  // Update form values when enrollments change
  useEffect(() => {
    if (enrollments.length > 0) {
      const enrollmentGrades = enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        score: 0,
      }));
      
      form.setValue("enrollmentGrades", enrollmentGrades);
    }
  }, [enrollments, form]);

  const createGradeMutation = useMutation({
    mutationFn: async (records: any[]) => {
      return Promise.all(
        records.map((record) => 
          apiRequest("POST", "/api/grades", record)
            .then(res => res.json())
        )
      );
    },
  });

  async function onSubmit(data: GradeFormValues) {
    setIsLoading(true);
    try {
      // Format records for API
      const records = data.enrollmentGrades.map(grade => ({
        enrollmentId: grade.enrollmentId,
        assignmentName: data.assignmentName,
        score: grade.score,
        maxScore: data.maxScore,
        weight: data.weight,
        date: new Date().toISOString(),
      }));
      
      // Submit grade records
      await createGradeMutation.mutateAsync(records);
      
      toast({
        title: "Grades recorded",
        description: "Grades have been recorded successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to record grades",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="courseAssignmentId"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Course</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      setSelectedCourseAssignment(parseInt(value));
                    }}
                    value={field.value.toString()}
                    disabled={isLoadingCourses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseAssignments?.map((assignment: any) => (
                        <SelectItem key={assignment.id} value={assignment.id.toString()}>
                          {assignment.course?.title || `Course ID: ${assignment.courseId}`} - {assignment.semester} {assignment.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="assignmentName"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Assignment Name</FormLabel>
                <FormControl>
                  <Input placeholder="Midterm Exam" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maxScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Score</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {enrollments.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Student Grades</h3>
            
            {enrollments.map((enrollment, index) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {enrollment.student?.user?.profileImage && (
                        <img 
                          src={enrollment.student.user.profileImage}
                          alt={enrollment.student.user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{enrollment.student?.user?.name || "Unknown Student"}</p>
                        <p className="text-sm text-neutral-500">{enrollment.student?.studentId || "No ID"}</p>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`enrollmentGrades.${index}.score`}
                      render={({ field }) => (
                        <FormItem className="w-full md:w-48">
                          <FormLabel>Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max={form.watch("maxScore")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedCourseAssignment ? (
          <div className="py-8 text-center">
            <p className="text-neutral-500">No students enrolled in this course.</p>
          </div>
        ) : null}
        
        {enrollments.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Submit Grades"
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
