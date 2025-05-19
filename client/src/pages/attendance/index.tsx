import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { Plus, Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Attendance() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [showNewAttendanceDialog, setShowNewAttendanceDialog] = useState(
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

  // Fetch all attendance records (for admin)
  const { data: allAttendance, isLoading: isLoadingAllAttendance } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/attendance");
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

  // Fetch student's own attendance
  const { data: studentAttendance, isLoading: isLoadingStudentAttendance } = useQuery({
    queryKey: ["/api/students/attendance", profileData?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/students/${profileData.id}`);
      const studentData = await response.json();
      
      // Extract all attendance records from all enrollments
      return studentData.enrollments
        .flatMap((enrollment: any) => 
          enrollment.attendance?.map((a: any) => ({
            ...a,
            courseName: enrollment.course?.title || "Unknown",
            courseCode: enrollment.course?.code || "N/A",
          })) || []
        )
        .filter(Boolean);
    },
    enabled: !!profileData && user?.role === "student",
  });

  const closeDialog = () => {
    setShowNewAttendanceDialog(false);
    // Remove the query parameter from the URL
    const url = location.split("?")[0];
    setLocation(url);
  };

  const openNewAttendanceDialog = () => {
    setShowNewAttendanceDialog(true);
    // Add the query parameter to the URL
    setLocation("?action=new", { replace: true });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  // Only admin and faculty can add attendance
  const canAddAttendance = user?.role === 'admin' || user?.role === 'faculty';
  
  // Determine what data to show based on user role
  const attendanceData = user?.role === "student" 
    ? studentAttendance || [] 
    : user?.role === "faculty" 
      ? facultyEnrollments?.flatMap((enrollment: any) => 
          enrollment.attendance?.map((a: any) => ({
            ...a,
            studentName: enrollment.student?.user?.name || "Unknown",
            studentId: enrollment.student?.studentId || "N/A",
            studentImage: enrollment.student?.user?.profileImage,
            courseName: enrollment.course?.title || "Unknown",
          })) || []
        ).filter(Boolean) || []
      : allAttendance || [];
  
  const isLoading = 
    user?.role === "student" ? isLoadingStudentAttendance : 
    user?.role === "faculty" ? isLoadingFacultyEnrollments : 
    isLoadingAllAttendance;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title="Attendance"
        description="Track and manage class attendance"
        actions={
          <>
            <Button variant="outline" className="hidden md:flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </Button>
            {canAddAttendance && (
              <Button onClick={openNewAttendanceDialog} className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Record Attendance
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>View and manage attendance for all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={attendanceData}
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
                  key: "date",
                  title: "Date",
                  render: (row) => <div>{format(new Date(row.date), "PPP")}</div>,
                },
                {
                  key: "status",
                  title: "Status",
                  render: (row) => (
                    <Badge className={getStatusBadgeColor(row.status)} variant="outline">
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  key: "notes",
                  title: "Notes",
                  render: (row) => <div>{row.notes || "-"}</div>,
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
                  key: "date",
                  title: "Date",
                  render: (row) => <div>{format(new Date(row.date), "PPP")}</div>,
                },
                {
                  key: "status",
                  title: "Status",
                  render: (row) => (
                    <Badge className={getStatusBadgeColor(row.status)} variant="outline">
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  key: "notes",
                  title: "Notes",
                  render: (row) => <div>{row.notes || "-"}</div>,
                }
              ]}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              searchField={user?.role === "student" ? "courseName" : "studentName"}
            />
          </CardContent>
        </Card>
      </div>

      {canAddAttendance && (
        <Dialog open={showNewAttendanceDialog} onOpenChange={setShowNewAttendanceDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Record Attendance</DialogTitle>
              <DialogDescription>
                Take attendance for a class session
              </DialogDescription>
            </DialogHeader>
            <AttendanceForm onSuccess={closeDialog} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
