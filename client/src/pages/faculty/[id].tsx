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
import { Edit, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FacultyForm } from "@/components/faculty/faculty-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface FacultyDetailProps {
  id: string;
}

export default function FacultyDetail({ id }: FacultyDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch faculty details
  const { data: faculty, isLoading, error } = useQuery({
    queryKey: ["/api/faculty", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/faculty/${id}`);
      return response.json();
    },
  });

  // Delete faculty mutation
  const deleteFacultyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/faculty/${id}`);
      // Also delete the user
      if (faculty?.user?.id) {
        await apiRequest("DELETE", `/api/users/${faculty.user.id}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Faculty deleted",
        description: "Faculty record has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/faculty"] });
      setLocation("/faculty");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete faculty",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    try {
      await deleteFacultyMutation.mutateAsync();
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
      case "inactive":
        return "bg-red-100 text-red-800";
      case "on leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

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

  if (error || !faculty) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load faculty details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => setLocation("/faculty")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculty
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header
        title="Faculty Details"
        description="View and manage faculty information"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/faculty")}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
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
        }
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Faculty personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                {faculty.user?.profileImage ? (
                  <AvatarImage src={faculty.user.profileImage} alt={faculty.user?.name || "Faculty"} />
                ) : (
                  <AvatarFallback className="text-2xl">{faculty.user?.name?.charAt(0) || "F"}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{faculty.user?.name}</h3>
                <p className="text-neutral-500">{faculty.user?.email}</p>
              </div>
              <Badge className={getStatusBadgeColor(faculty.status)} variant="outline">
                {faculty.status}
              </Badge>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Faculty ID:</span>
                <span className="font-medium">{faculty.facultyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Department:</span>
                <span className="font-medium">{faculty.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Position:</span>
                <span className="font-medium">{faculty.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Join Date:</span>
                <span className="font-medium">
                  {new Date(faculty.joinDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Username:</span>
                <span className="font-medium">{faculty.user?.username}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Academic Information */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="courses">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Teaching Information</CardTitle>
                <TabsList>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>Course assignments and students</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="courses" className="space-y-4">
                <h3 className="text-lg font-medium">Assigned Courses</h3>
                {faculty.courses?.length > 0 ? (
                  <DataTable
                    data={faculty.courses}
                    columns={[
                      {
                        key: "course",
                        title: "Course",
                        render: (row) => (
                          <div>
                            <div className="font-medium">{row.course?.title}</div>
                            <div className="text-sm text-neutral-500">{row.course?.code}</div>
                          </div>
                        ),
                      },
                      {
                        key: "semester",
                        title: "Semester",
                        render: (row) => <div>{row.semester} {row.year}</div>,
                      },
                      {
                        key: "credits",
                        title: "Credits",
                        render: (row) => <div>{row.course?.credits}</div>,
                      },
                      {
                        key: "status",
                        title: "Status",
                        render: (row) => (
                          <Badge 
                            className={row.course?.status === "active" ? "bg-green-100 text-green-800" : 
                                      row.course?.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                      "bg-neutral-100 text-neutral-800"} 
                            variant="outline"
                          >
                            {row.course?.status}
                          </Badge>
                        ),
                      },
                    ]}
                    keyExtractor={(item) => item.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No courses assigned
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <h3 className="text-lg font-medium">Enrolled Students</h3>
                {faculty.courses?.some(c => c.enrollments?.length > 0) ? (
                  <DataTable
                    data={faculty.courses
                      .flatMap(course => course.enrollments || [])
                      .filter(Boolean)
                      .map(enrollment => ({
                        ...enrollment,
                        courseName: faculty.courses.find(c => c.id === enrollment.courseAssignmentId)?.course?.title
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
                        key: "courseName",
                        title: "Course",
                        render: (row) => <div>{row.courseName}</div>,
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
                    No students enrolled in any courses
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Edit Faculty Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
            <DialogDescription>
              Make changes to the faculty member's information.
            </DialogDescription>
          </DialogHeader>
          <FacultyForm 
            initialData={{
              userId: faculty.userId,
              facultyId: faculty.facultyId,
              department: faculty.department,
              position: faculty.position,
              status: faculty.status as any,
              username: faculty.user?.username,
              name: faculty.user?.name,
              email: faculty.user?.email,
              profileImage: faculty.user?.profileImage,
            }} 
            onSuccess={() => {
              setShowEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ["/api/faculty", id] });
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this faculty member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteFacultyMutation.isPending}
            >
              {deleteFacultyMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
