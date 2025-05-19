import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradeForm } from "@/components/grades/grade-form";
import { Plus, Download, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function Grades() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [showNewGradeDialog, setShowNewGradeDialog] = useState(
    new URLSearchParams(location.split("?")[1]).get("action") === "new"
  );

  // Get faculty/student ID based on user role
  const { data: profileData } = useQuery({
    queryKey: [user?.role === "faculty" ? "/api/faculty" : "/api/students"],
    queryFn: async () => {
      const response = await apiRequest("GET", user?.role === "faculty" ? "/api/faculty" : "/api/students");
      const data = await response.json();
      if (user?.role === "faculty") {
        return data.find((f: any) => f.user.id === user.id);
      } else if (user?.role === "student") {
        return data.find((s: any) => s.user.id === user.id);
      }
      return null;
    },
    enabled: user?.role === "faculty" || user?.role === "student",
  });

  // Fetch all grades (for admin)
  const { data: allGrades, isLoading: isLoadingAllGrades } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/grades");
      return response.json();
    },
    enabled: user?.role === "admin",
  });

  // Fetch enrollments for faculty
  const { data: facultyEnrollments, isLoading: isLoadingFacultyEnrollments } = useQuery({
    queryKey: ["/api/faculty/enrollments", profileData?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/faculty/${profileData.id}`);
      const facultyData = await response.json();
      
      // Extract all enrollments from all course assignments
      return facultyData.courses
        .flatMap((course: any) => course.enrollments || [])
        .filter(Boolean);
    },
    enabled: !!profileData && user?.role === "faculty",
  });

  // Fetch student's own grades
  const { data: studentGrades, isLoading: isLoadingStudentGrades } = useQuery({
    queryKey: ["/api/students/grades", profileData?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/students/${profileData.id}`);
      const studentData = await response.json();
      
      // Extract all grade records from all enrollments
      return studentData.enrollments
        .flatMap((enrollment: any) => 
          enrollment.grades?.map((g: any) => ({
            ...g,
            courseName: enrollment.course?.title || "Unknown",
            courseCode: enrollment.course?.code || "N/A",
          })) || []
        )
        .filter(Boolean);
    },
    enabled: !!profileData && user?.role === "student",
  });

  const closeDialog = () => {
    setShowNewGradeDialog(false);
    // Remove the query parameter from the URL
    const url = location.split("?")[0];
    setLocation(url);
  };

  const openNewGradeDialog = () => {
    setShowNewGradeDialog(true);
    // Add the query parameter to the URL
    setLocation("?action=new", { replace: true });
  };

  // Get grade performance color
  const getGradePerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-green-400";
    if (percentage >= 70) return "bg-yellow-400";
    if (percentage >= 60) return "bg-orange-400";
    return "bg-red-500";
  };

  // Only admin and faculty can add grades
  const canAddGrades = user?.role === 'admin' || user?.role === 'faculty';
  
  // Determine what data to show based on user role
  const gradeData = user?.role === "student" 
    ? studentGrades || [] 
    : user?.role === "faculty" 
      ? facultyEnrollments?.flatMap((enrollment: any) => 
          enrollment.grades?.map((g: any) => ({
            ...g,
            studentName: enrollment.student?.user?.name || "Unknown",
            studentId: enrollment.student?.studentId || "N/A",
            studentImage: enrollment.student?.user?.profileImage,
            courseName: enrollment.course?.title || "Unknown",
          })) || []
        ).filter(Boolean) || []
      : allGrades || [];
  
  const isLoading = 
    user?.role === "student" ? isLoadingStudentGrades : 
    user?.role === "faculty" ? isLoadingFacultyEnrollments : 
    isLoadingAllGrades;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title="Grades"
        description="View and manage student grades"
        actions={
          <>
            <Button variant="outline" className="hidden md:flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </Button>
            {canAddGrades && (
              <Button onClick={openNewGradeDialog} className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Record Grades
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Records</CardTitle>
            <CardDescription>View and manage grades for all assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={gradeData}
              columns={user?.role === "student" ? [
                {
                  key: "courseName",
                  title: "Course",
                  render: (row) => (
                    <div>
                      <div className="font-medium">{row.courseName}</div>
                      <div className="text-sm text-neutral-500">{row.courseCode}</div>
                    </div>
                  ),
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
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{row.score}/{row.maxScore} ({((row.score / row.maxScore) * 100).toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={(row.score / row.maxScore) * 100} 
                        className="h-2" 
                        indicatorClassName={getGradePerformanceColor((row.score / row.maxScore) * 100)}
                      />
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
                  render: (row) => <div>{format(new Date(row.date), "PPP")}</div>,
                }
              ] : [
                {
                  key: "student",
                  title: "Student",
                  render: (row) => (
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        {row.studentImage ? (
                          <AvatarImage src={row.studentImage} alt={row.studentName || "Student"} />
                        ) : (
                          <AvatarFallback>{row.studentName?.charAt(0) || "S"}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{row.studentName}</div>
                        <div className="text-sm text-neutral-500">{row.studentId}</div>
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
                  key: "assignmentName",
                  title: "Assignment",
                  render: (row) => <div>{row.assignmentName}</div>,
                },
                {
                  key: "score",
                  title: "Score",
                  render: (row) => (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{row.score}/{row.maxScore} ({((row.score / row.maxScore) * 100).toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={(row.score / row.maxScore) * 100} 
                        className="h-2" 
                        indicatorClassName={getGradePerformanceColor((row.score / row.maxScore) * 100)}
                      />
                    </div>
                  ),
                },
                {
                  key: "weight",
                  title: "Weight",
                  render: (row) => <div>{row.weight}%</div>,
                }
              ]}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              searchField={user?.role === "student" ? "courseName" : "studentName"}
            />
          </CardContent>
        </Card>
      </div>

      {canAddGrades && (
        <Dialog open={showNewGradeDialog} onOpenChange={setShowNewGradeDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Record Grades</DialogTitle>
              <DialogDescription>
                Enter grades for a class assignment
              </DialogDescription>
            </DialogHeader>
            <GradeForm onSuccess={closeDialog} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
