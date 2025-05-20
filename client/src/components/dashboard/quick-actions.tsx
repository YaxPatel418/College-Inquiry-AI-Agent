import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  UserPlus,
  ClipboardCheck,
  FileText,
  Settings,
  GraduationCap,
  BookOpen,
  CalendarRange
} from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  href: string;
  roles: string[];
}

export function QuickActions() {
  const { user } = useAuth();
  const role = user?.role || "";

  const allActions: QuickAction[] = [
    {
      icon: <UserPlus className="h-6 w-6" />,
      title: "Add Student",
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      href: "/students?action=new",
      roles: ["admin"],
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Add Faculty",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/faculty?action=new",
      roles: ["admin"],
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Add Course",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/courses?action=new",
      roles: ["admin"],
    },
    {
      icon: <ClipboardCheck className="h-6 w-6" />,
      title: "Take Attendance",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/attendance?action=new",
      roles: ["admin", "faculty"],
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Record Grades",
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/grades?action=new",
      roles: ["admin", "faculty"],
    },
    {
      icon: <CalendarRange className="h-6 w-6" />,
      title: "View Schedule",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      href: "/courses",
      roles: ["admin", "faculty", "student"],
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Generate Report",
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/reports",
      roles: ["admin"],
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Settings",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/settings",
      roles: ["admin", "faculty", "student"],
    },
  ];

  // Filter actions based on user role
  const availableActions = allActions.filter(action => 
    action.roles.includes(role)
  );

  // Take first 4 actions that match the user's role
  const displayActions = availableActions.slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {displayActions.map((action, index) => (
            <Link 
              key={index} 
              href={action.href}
              className="bg-neutral-50 p-4 rounded-xl flex flex-col items-center justify-center hover:bg-neutral-100 transition-colors"
            >
              <div className={`h-10 w-10 ${action.bgColor} ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
