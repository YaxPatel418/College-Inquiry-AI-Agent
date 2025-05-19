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
const facultyFormSchema = z.object({
  userId: z.number().optional(),
  facultyId: z.string().min(1, "Faculty ID is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  status: z.enum(["active", "inactive", "on leave"]),
  // User fields
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  profileImage: z.string().optional(),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface FacultyFormProps {
  initialData?: Partial<FacultyFormValues>;
  onSuccess?: () => void;
  isEdit?: boolean;
}

export function FacultyForm({ initialData, onSuccess, isEdit = false }: FacultyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      userId: initialData?.userId || undefined,
      facultyId: initialData?.facultyId || "",
      department: initialData?.department || "",
      position: initialData?.position || "",
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
        role: "faculty",
        profileImage: data.profileImage,
      });
    },
  });

  const createFacultyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await createItem("/api/faculty", data);
    },
  });

  const updateFacultyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await updateItem("/api/faculty", id, data);
    },
  });

  async function onSubmit(data: FacultyFormValues) {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.userId) {
        // Update existing faculty
        await updateFacultyMutation.mutateAsync({
          id: initialData.userId,
          data: {
            facultyId: data.facultyId,
            department: data.department,
            position: data.position,
            status: data.status,
          },
        });
        toast({
          title: "Faculty updated",
          description: "Faculty information has been updated successfully.",
        });
      } else {
        // Create new user first
        const newUser = await createUserMutation.mutateAsync(data);
        
        // Then create faculty profile
        await createFacultyMutation.mutateAsync({
          userId: newUser.id,
          facultyId: data.facultyId,
          department: data.department,
          position: data.position,
          status: data.status,
        });
        
        toast({
          title: "Faculty created",
          description: "New faculty member has been registered successfully.",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/faculty"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to save faculty",
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
            <h3 className="text-lg font-medium">Faculty Information</h3>
            
            <FormField
              control={form.control}
              name="facultyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty ID</FormLabel>
                  <FormControl>
                    <Input placeholder="FAC1234" {...field} />
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
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Associate Professor" {...field} />
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
              isEdit ? "Update Faculty" : "Create Faculty"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
