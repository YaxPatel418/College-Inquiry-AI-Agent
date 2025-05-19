import { Header } from "@/components/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventsList } from "@/components/dashboard/events-list";
import { CourseOverview } from "@/components/dashboard/course-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CampusHighlights } from "@/components/dashboard/campus-highlights";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Users, GraduationCap, BookOpen, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard/stats");
      return response.json();
    },
  });

  // Fetch upcoming events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/events/upcoming"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events/upcoming");
      return response.json();
    },
  });

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/students");
      return response.json();
    },
    enabled: user?.role === "admin" || user?.role === "faculty",
  });

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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title={`${user?.role === "admin" ? "Admin" : user?.role === "faculty" ? "Faculty" : "Student"} Dashboard`}
        description={`Welcome back${user?.name ? ", " + user.name : ""}`}
        actions={
          <>
            <Button variant="outline" className="hidden md:flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Download Report
            </Button>
            {(user?.role === "admin" || user?.role === "faculty") && (
              <Link href="/students?action=new">
                <Button className="hidden md:flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Student
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<Users className="h-8 w-8" />}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-50"
          trend={{
            value: 8.1,
            label: "from last semester",
            trend: "up",
          }}
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Faculty Members"
          value={stats?.totalFaculty || 0}
          icon={<GraduationCap className="h-8 w-8" />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          trend={{
            value: 3.2,
            label: "from last semester",
            trend: "up",
          }}
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Active Courses"
          value={stats?.activeCourses || 0}
          icon={<BookOpen className="h-8 w-8" />}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
          trend={{
            value: 2.3,
            label: "from last semester",
            trend: "down",
          }}
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate || 0}%`}
          icon={<CheckCircle className="h-8 w-8" />}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          trend={{
            value: 4.5,
            label: "from last semester",
            trend: "up",
          }}
          isLoading={isLoadingStats}
        />
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left and Middle - Students Table Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Students Table */}
          {(user?.role === "admin" || user?.role === "faculty") && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-heading font-semibold">Recent Students</h2>
                  <div className="mt-3 sm:mt-0 flex space-x-2">
                    <Link href="/students">
                      <Button size="sm">View All</Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <DataTable
                data={students || []}
                columns={[
                  {
                    key: "user",
                    title: "Student",
                    render: (row) => (
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          {row.user?.profileImage ? (
                            <AvatarImage src={row.user.profileImage} alt={row.user?.name || "Student"} />
                          ) : (
                            <AvatarFallback>{row.user?.name?.charAt(0) || "S"}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{row.user?.name}</div>
                          <div className="text-sm text-neutral-500">{row.user?.email}</div>
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
                    key: "status",
                    title: "Status",
                    render: (row) => (
                      <Badge className={getStatusBadgeColor(row.status)} variant="outline">
                        {row.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "action",
                    title: "Action",
                    render: (row) => (
                      <Link href={`/students/${row.id}`}>
                        <a className="text-primary-600 hover:text-primary-800">View</a>
                      </Link>
                    ),
                  },
                ]}
                keyExtractor={(item) => item.id}
                isLoading={isLoadingStudents}
                onRowClick={(student) => {
                  window.location.href = `/students/${student.id}`;
                }}
              />
            </div>
          )}

          {/* Upcoming Events */}
          <EventsList events={events || []} isLoading={isLoadingEvents} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Course Overview */}
          <CourseOverview 
            courseStats={stats?.courseStatistics || {
              active: { count: 0, percentage: 0 },
              pending: { count: 0, percentage: 0 },
              archived: { count: 0, percentage: 0 },
            }}
            popularCourses={stats?.popularCourses || []}
            isLoading={isLoadingStats}
          />
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Campus Highlights */}
          <CampusHighlights />
        </div>
      </div>
    </div>
  );
}
