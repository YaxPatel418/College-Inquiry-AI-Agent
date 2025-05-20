import { useState } from "react";
import { Header } from "@/components/header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Download, BarChart, PieChart, UserCheck, CreditCard, CheckCircle, BookOpen } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard/stats");
      return response.json();
    },
  });

  // Fetch all courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses");
      return response.json();
    },
  });

  // Fetch all students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/students");
      return response.json();
    },
  });

  // Fetch all attendance records
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/attendance");
      return response.json();
    },
  });

  // Fetch all grades
  const { data: grades, isLoading: isLoadingGrades } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/grades");
      return response.json();
    },
  });

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance?.length || 0,
    present: attendance?.filter((a: any) => a.status === "present").length || 0,
    absent: attendance?.filter((a: any) => a.status === "absent").length || 0,
    late: attendance?.filter((a: any) => a.status === "late").length || 0,
    excused: attendance?.filter((a: any) => a.status === "excused").length || 0,
  };

  // Calculate attendance percentage
  const attendancePercentage = attendanceStats.total > 0
    ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100
    : 0;

  // Functions for downloading reports
  const downloadReport = (reportType: string) => {
    let csvContent = "";
    let filename = "";

    if (reportType === "attendance") {
      // Prepare attendance CSV headers
      csvContent = "Date,Student ID,Student Name,Course,Status,Notes\n";
      
      // Add attendance data
      attendance?.forEach((record: any) => {
        csvContent += `${format(new Date(record.date), "yyyy-MM-dd")},`;
        csvContent += `${record.studentId || ""},`;
        csvContent += `${record.studentName || ""},`;
        csvContent += `${record.courseName || ""},`;
        csvContent += `${record.status},`;
        csvContent += `"${record.notes || ""}"\n`;
      });
      
      filename = "attendance_report.csv";
    } else if (reportType === "grades") {
      // Prepare grades CSV headers
      csvContent = "Student ID,Student Name,Course,Assignment,Score,Max Score,Weight,Date\n";
      
      // Add grades data
      grades?.forEach((record: any) => {
        csvContent += `${record.studentId || ""},`;
        csvContent += `${record.studentName || ""},`;
        csvContent += `${record.courseName || ""},`;
        csvContent += `${record.assignmentName},`;
        csvContent += `${record.score},`;
        csvContent += `${record.maxScore},`;
        csvContent += `${record.weight},`;
        csvContent += `${format(new Date(record.date), "yyyy-MM-dd")}\n`;
      });
      
      filename = "grades_report.csv";
    } else if (reportType === "courses") {
      // Prepare courses CSV headers
      csvContent = "Code,Title,Department,Credits,Status,Students Enrolled\n";
      
      // Add courses data
      courses?.forEach((course: any) => {
        csvContent += `${course.code},`;
        csvContent += `"${course.title}",`;
        csvContent += `${course.department},`;
        csvContent += `${course.credits},`;
        csvContent += `${course.status},`;
        csvContent += `${course.studentCount || 0}\n`;
      });
      
      filename = "courses_report.csv";
    } else if (reportType === "students") {
      // Prepare students CSV headers
      csvContent = "Student ID,Name,Email,Program,Year Level,Status,Enrollment Date\n";
      
      // Add student data
      students?.forEach((student: any) => {
        csvContent += `${student.studentId},`;
        csvContent += `"${student.user?.name || ""}",`;
        csvContent += `${student.user?.email || ""},`;
        csvContent += `${student.program},`;
        csvContent += `${student.yearLevel},`;
        csvContent += `${student.status},`;
        csvContent += `${format(new Date(student.enrollmentDate), "yyyy-MM-dd")}\n`;
      });
      
      filename = "students_report.csv";
    }

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "present":
      case "active":
        return "bg-green-100 text-green-800";
      case "absent":
      case "inactive":
        return "bg-red-100 text-red-800";
      case "late":
      case "pending":
      case "on leave":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
      case "archived":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  // Only admin can access reports page
  if (user?.role !== "admin") {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
              <p className="text-neutral-500">You don't have permission to view reports.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title="Reports"
        description="Generate and view system reports"
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<UserCheck className="h-8 w-8" />}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-50"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Active Courses"
          value={stats?.activeCourses || 0}
          icon={<BookOpen className="h-8 w-8" />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Attendance Rate"
          value={`${attendancePercentage.toFixed(1)}%`}
          icon={<CheckCircle className="h-8 w-8" />}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          isLoading={isLoadingAttendance}
        />

        <StatCard
          title="Overall GPA"
          value={"3.4"}
          icon={<CreditCard className="h-8 w-8" />}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          isLoading={isLoadingGrades}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Report Generation</CardTitle>
              <CardDescription>View and export detailed reports</CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger 
                  value="attendance" 
                  className={activeTab === "attendance" ? "data-[state=active]:bg-primary-600" : ""}
                >
                  Attendance
                </TabsTrigger>
                <TabsTrigger 
                  value="grades" 
                  className={activeTab === "grades" ? "data-[state=active]:bg-primary-600" : ""}
                >
                  Grades
                </TabsTrigger>
                <TabsTrigger 
                  value="courses" 
                  className={activeTab === "courses" ? "data-[state=active]:bg-primary-600" : ""}
                >
                  Courses
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  className={activeTab === "students" ? "data-[state=active]:bg-primary-600" : ""}
                >
                  Students
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button 
              onClick={() => downloadReport(activeTab)}
              className="flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report
            </Button>
          </div>

          {activeTab === "attendance" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-neutral-500">Present</p>
                        <p className="text-xl font-bold">{attendanceStats.present}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {attendanceStats.total > 0 ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-neutral-500">Late</p>
                        <p className="text-xl font-bold">{attendanceStats.late}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {attendanceStats.total > 0 ? ((attendanceStats.late / attendanceStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-neutral-500">Absent</p>
                        <p className="text-xl font-bold">{attendanceStats.absent}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {attendanceStats.total > 0 ? ((attendanceStats.absent / attendanceStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-neutral-500">Excused</p>
                        <p className="text-xl font-bold">{attendanceStats.excused}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {attendanceStats.total > 0 ? ((attendanceStats.excused / attendanceStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <DataTable
                data={attendance || []}
                columns={[
                  {
                    key: "student",
                    title: "Student",
                    render: (row) => (
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{row.studentName || "Unknown"}</div>
                          <div className="text-sm text-neutral-500">{row.studentId || "N/A"}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "course",
                    title: "Course",
                    render: (row) => <div>{row.courseName || "Unknown"}</div>,
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
                isLoading={isLoadingAttendance}
                searchField="studentName"
              />
            </div>
          )}

          {activeTab === "grades" && (
            <div>
              <DataTable
                data={grades || []}
                columns={[
                  {
                    key: "student",
                    title: "Student",
                    render: (row) => (
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{row.studentName || "Unknown"}</div>
                          <div className="text-sm text-neutral-500">{row.studentId || "N/A"}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "course",
                    title: "Course",
                    render: (row) => <div>{row.courseName || "Unknown"}</div>,
                  },
                  {
                    key: "assignment",
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
                        />
                      </div>
                    ),
                  },
                  {
                    key: "date",
                    title: "Date",
                    render: (row) => <div>{format(new Date(row.date), "PPP")}</div>,
                  }
                ]}
                keyExtractor={(item) => item.id}
                isLoading={isLoadingGrades}
                searchField="studentName"
              />
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              <div className="mb-6">
                <h3 className="text-base font-medium mb-2">Course Status Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Active Courses</span>
                      <span className="text-sm font-medium text-neutral-500">{stats?.courseStatistics.active.percentage}%</span>
                    </div>
                    <Progress value={stats?.courseStatistics.active.percentage || 0} className="h-2 bg-primary-100" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Pending Courses</span>
                      <span className="text-sm font-medium text-neutral-500">{stats?.courseStatistics.pending.percentage}%</span>
                    </div>
                    <Progress value={stats?.courseStatistics.pending.percentage || 0} className="h-2 bg-secondary-100" indicatorClassName="bg-secondary-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Archived Courses</span>
                      <span className="text-sm font-medium text-neutral-500">{stats?.courseStatistics.archived.percentage}%</span>
                    </div>
                    <Progress value={stats?.courseStatistics.archived.percentage || 0} className="h-2 bg-neutral-100" indicatorClassName="bg-neutral-400" />
                  </div>
                </div>
              </div>
              
              <DataTable
                data={courses || []}
                columns={[
                  {
                    key: "code",
                    title: "Code",
                    render: (row) => <div className="font-medium">{row.code}</div>,
                  },
                  {
                    key: "title",
                    title: "Title",
                    render: (row) => <div>{row.title}</div>,
                  },
                  {
                    key: "department",
                    title: "Department",
                    render: (row) => <div>{row.department}</div>,
                  },
                  {
                    key: "credits",
                    title: "Credits",
                    render: (row) => <div>{row.credits}</div>,
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
                    key: "students",
                    title: "Students",
                    render: (row) => <div>{row.studentCount || 0}</div>,
                  }
                ]}
                keyExtractor={(item) => item.id}
                isLoading={isLoadingCourses}
                searchField="title"
              />
            </div>
          )}

          {activeTab === "students" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <h3 className="text-base font-medium mb-2">Status Distribution</h3>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-neutral-500">Active</p>
                          <p className="text-xl font-bold">
                            {students?.filter((s: any) => s.status === "active").length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">On Leave</p>
                          <p className="text-xl font-bold">
                            {students?.filter((s: any) => s.status === "on leave").length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Inactive</p>
                          <p className="text-xl font-bold">
                            {students?.filter((s: any) => s.status === "inactive").length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <h3 className="text-base font-medium mb-2">Year Level</h3>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((year) => {
                          const count = students?.filter((s: any) => s.yearLevel === year).length || 0;
                          const percentage = students?.length ? (count / students.length) * 100 : 0;
                          
                          return (
                            <div key={year}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Year {year}</span>
                                <span className="text-sm text-neutral-500">{count} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-base font-medium mb-2">Top Programs</h3>
                    {(() => {
                      const programs: Record<string, number> = {};
                      students?.forEach((student: any) => {
                        programs[student.program] = (programs[student.program] || 0) + 1;
                      });
                      
                      return Object.entries(programs)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .slice(0, 3)
                        .map(([program, count]) => {
                          const percentage = students?.length ? (count / students.length) * 100 : 0;
                          
                          return (
                            <div key={program} className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{program}</span>
                                <span className="text-sm text-neutral-500">{count} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        });
                    })()}
                  </CardContent>
                </Card>
              </div>

              <DataTable
                data={students || []}
                columns={[
                  {
                    key: "user",
                    title: "Student",
                    render: (row) => (
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{row.user?.name || "Unknown"}</div>
                          <div className="text-sm text-neutral-500">{row.user?.email || "N/A"}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "studentId",
                    title: "ID",
                    render: (row) => <div>{row.studentId}</div>,
                  },
                  {
                    key: "program",
                    title: "Program",
                    render: (row) => <div>{row.program}</div>,
                  },
                  {
                    key: "yearLevel",
                    title: "Year",
                    render: (row) => <div>{row.yearLevel}</div>,
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
                    key: "enrollmentDate",
                    title: "Enrolled On",
                    render: (row) => <div>{format(new Date(row.enrollmentDate), "PPP")}</div>,
                  }
                ]}
                keyExtractor={(item) => item.id}
                isLoading={isLoadingStudents}
                searchField="user.name"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
