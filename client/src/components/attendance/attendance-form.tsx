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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const attendanceFormSchema = z.object({
  courseAssignmentId: z.coerce.number(),
  date: z.string(),
  attendanceRecords: z.array(
    z.object({
      enrollmentId: z.number(),
      status: z.enum(["present", "absent", "late", "excused"]),
      notes: z.string().optional(),
    })
  ),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  onSuccess?: () => void;
}

export function AttendanceForm({ onSuccess }: AttendanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Get faculty ID if the user is faculty
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

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      courseAssignmentId: 0,
      date: new Date().toISOString().split('T')[0],
      attendanceRecords: [],
    },
  });

  // Update form values when enrollments change
  useEffect(() => {
    if (enrollments.length > 0) {
      const attendanceRecords = enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: "present" as const,
        notes: "",
      }));
      
      form.setValue("attendanceRecords", attendanceRecords);
    }
  }, [enrollments, form]);

  const createAttendanceMutation = useMutation({
    mutationFn: async (records: any[]) => {
      return Promise.all(
        records.map((record) => 
          apiRequest("POST", "/api/attendance", record)
            .then(res => res.json())
        )
      );
    },
  });

  async function onSubmit(data: AttendanceFormValues) {
    setIsLoading(true);
    try {
      // Format records for API
      const records = data.attendanceRecords.map(record => ({
        enrollmentId: record.enrollmentId,
        date: new Date(data.date).toISOString(),
        status: record.status,
        notes: record.notes || "",
      }));
      
      // Submit attendance records
      await createAttendanceMutation.mutateAsync(records);
      
      toast({
        title: "Attendance recorded",
        description: "Attendance has been recorded successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to record attendance",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="courseAssignmentId"
            render={({ field }) => (
              <FormItem>
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {enrollments.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Student Attendance</h3>
            
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
                      <div>
                        <Label htmlFor={`status-${enrollment.id}`}>Status</Label>
                        <Controller
                          control={form.control}
                          name={`attendanceRecords.${index}.status`}
                          render={({ field }) => (
                            <RadioGroup 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-wrap gap-2 mt-1"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="present" id={`present-${enrollment.id}`} />
                                <Label htmlFor={`present-${enrollment.id}`} className="text-sm">Present</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="absent" id={`absent-${enrollment.id}`} />
                                <Label htmlFor={`absent-${enrollment.id}`} className="text-sm">Absent</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="late" id={`late-${enrollment.id}`} />
                                <Label htmlFor={`late-${enrollment.id}`} className="text-sm">Late</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="excused" id={`excused-${enrollment.id}`} />
                                <Label htmlFor={`excused-${enrollment.id}`} className="text-sm">Excused</Label>
                              </div>
                            </RadioGroup>
                          )}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`notes-${enrollment.id}`}>Notes</Label>
                        <Controller
                          control={form.control}
                          name={`attendanceRecords.${index}.notes`}
                          render={({ field }) => (
                            <Input 
                              id={`notes-${enrollment.id}`}
                              placeholder="Any comments?"
                              className="mt-1"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
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
                "Submit Attendance"
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

// Helper component for FormField array fields
import { Controller } from "react-hook-form";
