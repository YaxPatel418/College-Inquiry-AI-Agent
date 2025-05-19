import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FacultyForm } from "@/components/faculty/faculty-form";
import { Plus, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Faculty() {
  const [location, setLocation] = useLocation();
  const [showNewFacultyDialog, setShowNewFacultyDialog] = useState(
    new URLSearchParams(location.split("?")[1]).get("action") === "new"
  );

  // Fetch faculty
  const { data: faculty, isLoading } = useQuery({
    queryKey: ["/api/faculty"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/faculty");
      return response.json();
    },
  });

  const closeDialog = () => {
    setShowNewFacultyDialog(false);
    // Remove the query parameter from the URL
    const url = location.split("?")[0];
    setLocation(url);
  };

  const openNewFacultyDialog = () => {
    setShowNewFacultyDialog(true);
    // Add the query parameter to the URL
    setLocation("?action=new", { replace: true });
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header 
        title="Faculty"
        description="Manage faculty members and departments"
        actions={
          <>
            <Button variant="outline" className="hidden md:flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </Button>
            <Button onClick={openNewFacultyDialog} className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Faculty
            </Button>
          </>
        }
      />

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        <DataTable
          data={faculty || []}
          columns={[
            {
              key: "user",
              title: "Faculty",
              render: (row) => (
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {row.user?.profileImage ? (
                      <AvatarImage src={row.user.profileImage} alt={row.user?.name || "Faculty"} />
                    ) : (
                      <AvatarFallback>{row.user?.name?.charAt(0) || "F"}</AvatarFallback>
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
              key: "facultyId",
              title: "ID",
              render: (row) => <div>{row.facultyId}</div>,
            },
            {
              key: "department",
              title: "Department",
              render: (row) => <div>{row.department}</div>,
            },
            {
              key: "position",
              title: "Position",
              render: (row) => <div>{row.position}</div>,
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
          onRowClick={(faculty) => {
            setLocation(`/faculty/${faculty.id}`);
          }}
          isLoading={isLoading}
          searchField="user.name"
        />
      </div>

      <Dialog open={showNewFacultyDialog} onOpenChange={setShowNewFacultyDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>
              Fill out the form below to register a new faculty member.
            </DialogDescription>
          </DialogHeader>
          <FacultyForm onSuccess={closeDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
