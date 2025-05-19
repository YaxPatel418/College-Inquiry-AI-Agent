import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createItem, updateItem } from "@/lib/api";

// Extended schema for the form
const courseFormSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Course title is required"),
  description: z.string().optional(),
  credits: z.coerce.number().min(1, "Credits must be at least 1"),
  department: z.string().min(1, "Department is required"),
  status: z.enum(["active", "pending", "archived"]),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Partial<CourseFormValues>;
  onSuccess?: () => void;
  isEdit?: boolean;
}

export function CourseForm({ initialData, onSuccess, isEdit = false }: CourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      credits: initialData?.credits || 3,
      department: initialData?.department || "",
      status: initialData?.status || "active",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      return await createItem("/api/courses", data);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CourseFormValues }) => {
      return await updateItem("/api/courses", id, data);
    },
  });

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.code) {
        // Get course ID from existing data if it's an edit operation
        const courses = await queryClient.fetchQuery({
          queryKey: ["/api/courses"],
          queryFn: async () => {
            const response = await fetch("/api/courses", {
              credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch courses");
            return response.json();
          },
        });
        
        const course = courses.find((c: any) => c.code === initialData.code);
        
        if (course) {
          await updateCourseMutation.mutateAsync({
            id: course.id,
            data,
          });
          
          toast({
            title: "Course updated",
            description: "Course information has been updated successfully.",
          });
        } else {
          throw new Error("Course not found");
        }
      } else {
        // Create new course
        await createCourseMutation.mutateAsync(data);
        
        toast({
          title: "Course created",
          description: "New course has been created successfully.",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to save course",
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
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Course Information</h3>
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="CS101" {...field} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Course description"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Additional Details</h3>
            
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Update Course" : "Create Course"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
