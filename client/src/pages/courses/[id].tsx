import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Edit, ArrowLeft, Trash2, AlertTriangle, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseForm } from "@/components/courses/course-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CourseDetailProps {
  id: string;
}

export default function CourseDetail({ id }: CourseDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch course details
  const { data: course, isLoading, error } = useQuery({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/courses/${id}`);
      return response.json();
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Course deleted",
        description: "Course has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setLocation("/courses");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete course",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    try {
      await deleteCourseMutation.mutateAsync();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-neutral-100 text-neutral-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  // Only admins can edit/delete courses
  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-neutral-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-neutral-200 rounded mb-6"></div>
          <div className="h-[200px] bg-neutral-200 rounded-xl mb-6"></div>
          <div className="h-[400px] bg-neutral-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load course details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => setLocation("/courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header
        title="Course Details"
        description="View and manage course information"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/courses")}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            {isAdmin && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Details about this course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-primary-50 text-primary-600">
                <BookOpen className="h-12 w-12" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{course.title}</h3>
                <p className="text-neutral-500">{course.code}</p>
              </div>
              <Badge className={getStatusBadgeColor(course.status)} variant="outline">
                {course.status}
              </Badge>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Department:</span>
                <span className="font-medium">{course.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Credits:</span>
                <span className="font-medium">{course.credits}</span>
              </div>
              {course.description && (
                <div className="pt-2">
                  <span className="text-neutral-500">Description:</span>
                  <p className="mt-1 text-sm">{course.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course Details */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="faculty">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Class Information</CardTitle>
                <TabsList>
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>Faculty and enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="faculty" className="space-y-4">
                <h3 className="text-lg font-medium">Assigned Faculty</h3>
                {course.assignments?.length > 0 ? (
                  <DataTable
                    data={course.assignments}
                    columns={[
                      {
                        key: "faculty",
                        title: "Instructor",
                        render: (row) => (
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              {row.faculty?.user?.profileImage ? (
                                <AvatarImage src={row.faculty.user.profileImage} alt={row.faculty?.user?.name || "Faculty"} />
                              ) : (
                                <AvatarFallback>{row.facultyName?.charAt(0) || "F"}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{row.facultyName}</div>
                              <div className="text-sm text-neutral-500">{row.faculty?.department}</div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "semester",
                        title: "Semester",
                        render: (row) => <div>{row.semester} {row.year}</div>,
                      },
                    ]}
                    keyExtractor={(item) => item.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No faculty assigned to this course
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <h3 className="text-lg font-medium">Enrolled Students</h3>
                {course.assignments?.some(a => a.enrollments?.length > 0) ? (
                  <DataTable
                    data={course.assignments
                      .flatMap(assignment => assignment.enrollments || [])
                      .filter(Boolean)
                      .map(enrollment => ({
                        ...enrollment,
                        semester: course.assignments.find(a => a.id === enrollment.courseAssignmentId)?.semester,
                        year: course.assignments.find(a => a.id === enrollment.courseAssignmentId)?.year,
                      }))}
                    columns={[
                      {
                        key: "student",
                        title: "Student",
                        render: (row) => (
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              {row.student?.user?.profileImage ? (
                                <AvatarImage src={row.student.user.profileImage} alt={row.student.user?.name || "Student"} />
                              ) : (
                                <AvatarFallback>{row.student?.user?.name?.charAt(0) || "S"}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{row.student?.user?.name}</div>
                              <div className="text-sm text-neutral-500">{row.student?.studentId}</div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "semester",
                        title: "Semester",
                        render: (row) => <div>{row.semester} {row.year}</div>,
                      },
                      {
                        key: "enrollmentDate",
                        title: "Enrollment Date",
                        render: (row) => <div>{new Date(row.enrollmentDate).toLocaleDateString()}</div>,
                      },
                      {
                        key: "status",
                        title: "Status",
                        render: (row) => (
                          <Badge 
                            className={row.status === "enrolled" ? "bg-green-100 text-green-800" : 
                                      row.status === "dropped" ? "bg-red-100 text-red-800" : 
                                      "bg-blue-100 text-blue-800"} 
                            variant="outline"
                          >
                            {row.status}
                          </Badge>
                        ),
                      },
                    ]}
                    keyExtractor={(item) => item.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No students enrolled in this course
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Edit Course Dialog */}
      {isAdmin && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Make changes to the course details.
              </DialogDescription>
            </DialogHeader>
            <CourseForm 
              initialData={{
                code: course.code,
                title: course.title,
                description: course.description || "",
                credits: course.credits,
                department: course.department,
                status: course.status as any,
              }} 
              onSuccess={() => {
                setShowEditDialog(false);
                queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
              }}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {isAdmin && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this course? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteCourseMutation.isPending}
              >
                {deleteCourseMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
