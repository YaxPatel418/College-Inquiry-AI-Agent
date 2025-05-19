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
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createItem, updateItem } from "@/lib/api";

// Extended schema for the form
const studentFormSchema = z.object({
  userId: z.number().optional(),
  studentId: z.string().min(1, "Student ID is required"),
  program: z.string().min(1, "Program is required"),
  yearLevel: z.coerce.number().min(1, "Year level must be at least 1").max(6, "Year level must be at most 6"),
  status: z.enum(["active", "inactive", "on leave"]),
  // User fields
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  profileImage: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  initialData?: Partial<StudentFormValues>;
  onSuccess?: () => void;
  isEdit?: boolean;
}

export function StudentForm({ initialData, onSuccess, isEdit = false }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      userId: initialData?.userId || undefined,
      studentId: initialData?.studentId || "",
      program: initialData?.program || "",
      yearLevel: initialData?.yearLevel || 1,
      status: initialData?.status || "active",
      username: initialData?.username || "",
      password: initialData?.password || "",
      email: initialData?.email || "",
      name: initialData?.name || "",
      profileImage: initialData?.profileImage || "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await createItem("/api/users", {
        username: data.username,
        password: data.password,
        email: data.email,
        name: data.name,
        role: "student",
        profileImage: data.profileImage,
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await createItem("/api/students", data);
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await updateItem("/api/students", id, data);
    },
  });

  async function onSubmit(data: StudentFormValues) {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.userId) {
        // Update existing student
        await updateStudentMutation.mutateAsync({
          id: initialData.userId,
          data: {
            studentId: data.studentId,
            program: data.program,
            yearLevel: data.yearLevel,
            status: data.status,
          },
        });
        toast({
          title: "Student updated",
          description: "Student information has been updated successfully.",
        });
      } else {
        // Create new user first
        const newUser = await createUserMutation.mutateAsync(data);
        
        // Then create student profile
        await createStudentMutation.mutateAsync({
          userId: newUser.id,
          studentId: data.studentId,
          program: data.program,
          yearLevel: data.yearLevel,
          status: data.status,
        });
        
        toast({
          title: "Student created",
          description: "New student has been registered successfully.",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to save student",
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
            <h3 className="text-lg font-medium">Personal Information</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/profile.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Academic Information</h3>
            
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="STU1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="program"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <FormControl>
                    <Input placeholder="Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="yearLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Level</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {!isEdit && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
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
              isEdit ? "Update Student" : "Create Student"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
