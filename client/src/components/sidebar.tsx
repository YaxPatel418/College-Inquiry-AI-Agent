import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/faculty", label: "Faculty", icon: GraduationCap },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: BarChart2 },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const facultyNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/courses", label: "My Courses", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Determine navigation based on user role
  const navigation = user?.role === "admin" 
    ? adminNav 
    : user?.role === "faculty" 
      ? facultyNav 
      : studentNav;

  const NavItems = () => (
    <>
      <div className="p-4 border-b border-primary-700">
        <Link href="/dashboard" className="text-xl font-heading font-bold text-white">
          College Management
        </Link>
      </div>
      
      <div className="py-4 flex-1">
        <p className="px-4 text-xs font-semibold uppercase tracking-wider text-primary-100 mb-2">
          {user?.role === "admin" 
            ? "Admin Dashboard" 
            : user?.role === "faculty" 
              ? "Faculty Dashboard" 
              : "Student Dashboard"}
        </p>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-white",
                  isActive ? "bg-primary-700" : "hover:bg-primary-700/70"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            {user?.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user?.name} />
            ) : (
              <AvatarFallback className="bg-primary-700 text-white">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-primary-200 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm bg-primary-700 rounded-md hover:bg-primary-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden bg-primary-600 text-white p-4 w-full fixed top-0 z-10 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-heading font-bold">
          College Management
        </Link>
        <Button
          variant="ghost"
          className="text-white hover:bg-primary-700 p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-primary-600 text-white h-screen sticky top-0">
        <NavItems />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 z-50 md:hidden">
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-primary-600 text-white shadow-xl transform transition ease-in-out duration-300">
            <div className="flex justify-between items-center p-4 border-b border-primary-700">
              <h1 className="text-xl font-heading font-bold">College Management</h1>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-primary-700 p-1"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <NavItems />
          </div>
        </div>
      )}
    </>
  );
}
