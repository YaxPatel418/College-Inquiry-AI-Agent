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
import { StudentForm } from "@/components/students/student-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface StudentDetailProps {
  id: string;
}

export default function StudentDetail({ id }: StudentDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch student details
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["/api/students", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/students/${id}`);
      return response.json();
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/students/${id}`);
      // Also delete the user
      if (student?.user?.id) {
        await apiRequest("DELETE", `/api/users/${student.user.id}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "Student record has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setLocation("/students");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete student",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    try {
      await deleteStudentMutation.mutateAsync();
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

  if (error || !student) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load student details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => setLocation("/students")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header
        title="Student Details"
        description="View and manage student information"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/students")}
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
        {/* Student Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Student personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                {student.user?.profileImage ? (
                  <AvatarImage src={student.user.profileImage} alt={student.user?.name || "Student"} />
                ) : (
                  <AvatarFallback className="text-2xl">{student.user?.name?.charAt(0) || "S"}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{student.user?.name}</h3>
                <p className="text-neutral-500">{student.user?.email}</p>
              </div>
              <Badge className={getStatusBadgeColor(student.status)} variant="outline">
                {student.status}
              </Badge>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Student ID:</span>
                <span className="font-medium">{student.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Program:</span>
                <span className="font-medium">{student.program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Year Level:</span>
                <span className="font-medium">{student.yearLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Enrolled Since:</span>
                <span className="font-medium">
                  {new Date(student.enrollmentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Username:</span>
                <span className="font-medium">{student.user?.username}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Academic Information */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="courses">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Academic Information</CardTitle>
                <TabsList>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="grades">Grades</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>Academic records and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="courses" className="space-y-4">
                <h3 className="text-lg font-medium">Enrolled Courses</h3>
                {student.enrollments?.length > 0 ? (
                  <DataTable
                    data={student.enrollments}
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
                        key: "faculty",
                        title: "Instructor",
                        render: (row) => <div>{row.facultyName || "Not assigned"}</div>,
                      },
                      {
                        key: "status",
                        title: "Status",
                        render: (row) => (
                          <Badge 
                            className={row.enrollment.status === "enrolled" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-800"} 
                            variant="outline"
                          >
                            {row.enrollment.status}
                          </Badge>
                        ),
                      },
                    ]}
                    keyExtractor={(item) => item.enrollment.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No courses enrolled
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="attendance" className="space-y-4">
                <h3 className="text-lg font-medium">Attendance Records</h3>
                {student.enrollments?.some(e => e.attendance?.length > 0) ? (
                  <DataTable
                    data={student.enrollments.flatMap(e => 
                      e.attendance?.map(a => ({ ...a, courseName: e.course?.title })) || []
                    )}
                    columns={[
                      {
                        key: "courseName",
                        title: "Course",
                        render: (row) => <div>{row.courseName}</div>,
                      },
                      {
                        key: "date",
                        title: "Date",
                        render: (row) => <div>{new Date(row.date).toLocaleDateString()}</div>,
                      },
                      {
                        key: "status",
                        title: "Status",
                        render: (row) => (
                          <Badge 
                            className={
                              row.status === "present" ? "bg-green-100 text-green-800" : 
                              row.status === "absent" ? "bg-red-100 text-red-800" : 
                              row.status === "late" ? "bg-yellow-100 text-yellow-800" : 
                              "bg-blue-100 text-blue-800"
                            } 
                            variant="outline"
                          >
                            {row.status}
                          </Badge>
                        ),
                      },
                      {
                        key: "notes",
                        title: "Notes",
                        render: (row) => <div>{row.notes || "-"}</div>,
                      },
                    ]}
                    keyExtractor={(item) => item.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No attendance records found
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="grades" className="space-y-4">
                <h3 className="text-lg font-medium">Grade Records</h3>
                {student.enrollments?.some(e => e.grades?.length > 0) ? (
                  <DataTable
                    data={student.enrollments.flatMap(e => 
                      e.grades?.map(g => ({ ...g, courseName: e.course?.title })) || []
                    )}
                    columns={[
                      {
                        key: "courseName",
                        title: "Course",
                        render: (row) => <div>{row.courseName}</div>,
                      },
                      {
                        key: "assignmentName",
                        title: "Assignment",
                        render: (row) => <div>{row.assignmentName}</div>,
                      },
                      {
                        key: "score",
                        title: "Score",
                        render: (row) => (
                          <div className="font-medium">
                            {row.score}/{row.maxScore} ({((row.score / row.maxScore) * 100).toFixed(1)}%)
                          </div>
                        ),
                      },
                      {
                        key: "weight",
                        title: "Weight",
                        render: (row) => <div>{row.weight}%</div>,
                      },
                      {
                        key: "date",
                        title: "Date",
                        render: (row) => <div>{new Date(row.date).toLocaleDateString()}</div>,
                      },
                    ]}
                    keyExtractor={(item) => item.id}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No grade records found
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Make changes to the student's information.
            </DialogDescription>
          </DialogHeader>
          <StudentForm 
            initialData={{
              userId: student.userId,
              studentId: student.studentId,
              program: student.program,
              yearLevel: student.yearLevel,
              status: student.status as any,
              username: student.user?.username,
              name: student.user?.name,
              email: student.user?.email,
              profileImage: student.user?.profileImage,
            }} 
            onSuccess={() => {
              setShowEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ["/api/students", id] });
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
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
