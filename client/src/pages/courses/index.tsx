import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseForm } from "@/components/courses/course-form";
import { Plus, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function Courses() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [showNewCourseDialog, setShowNewCourseDialog] = useState(
    new URLSearchParams(location.split("?")[1]).get("action") === "new"
  );

  // Fetch courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses");
      return response.json();
    },
  });

  const closeDialog = () => {
    setShowNewCourseDialog(false);
    // Remove the query parameter from the URL
    const url = location.split("?")[0];
    setLocation(url);
  };

  const openNewCourseDialog = () => {
    setShowNewCourseDialog(true);
    // Add the query parameter to the URL
    setLocation("?action=new", { replace: true });
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

  // Only admins can add new courses
  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title="Courses"
        description="Browse and manage academic courses"
        actions={
          <>
            <Button variant="outline" className="hidden md:flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </Button>
            {isAdmin && (
              <Button onClick={openNewCourseDialog} className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add Course
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
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
          ]}
          keyExtractor={(item) => item.id}
          onRowClick={(course) => {
            setLocation(`/courses/${course.id}`);
          }}
          isLoading={isLoading}
          searchField="title"
        />
      </div>

      {isAdmin && (
        <Dialog open={showNewCourseDialog} onOpenChange={setShowNewCourseDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new course.
              </DialogDescription>
            </DialogHeader>
            <CourseForm onSuccess={closeDialog} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
