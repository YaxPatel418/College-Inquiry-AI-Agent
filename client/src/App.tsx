import { Switch, Route, useLocation, Redirect } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students/index";
import StudentDetail from "@/pages/students/[id]";
import Faculty from "@/pages/faculty/index";
import FacultyDetail from "@/pages/faculty/[id]";
import Courses from "@/pages/courses/index";
import CourseDetail from "@/pages/courses/[id]";
import Attendance from "@/pages/attendance/index";
import Grades from "@/pages/grades/index";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

// Route Guard for authenticated routes
const PrivateRoute = ({ component: Component, roles = [], ...rest }: any) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Dashboard */}
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      
      {/* Students */}
      <Route path="/students">
        <PrivateRoute component={Students} roles={["admin", "faculty"]} />
      </Route>
      <Route path="/students/:id">
        {(params) => <PrivateRoute component={StudentDetail} roles={["admin", "faculty"]} id={params.id} />}
      </Route>
      
      {/* Faculty */}
      <Route path="/faculty">
        <PrivateRoute component={Faculty} roles={["admin"]} />
      </Route>
      <Route path="/faculty/:id">
        {(params) => <PrivateRoute component={FacultyDetail} roles={["admin"]} id={params.id} />}
      </Route>
      
      {/* Courses */}
      <Route path="/courses">
        <PrivateRoute component={Courses} />
      </Route>
      <Route path="/courses/:id">
        {(params) => <PrivateRoute component={CourseDetail} id={params.id} />}
      </Route>
      
      {/* Attendance */}
      <Route path="/attendance">
        <PrivateRoute component={Attendance} />
      </Route>
      
      {/* Grades */}
      <Route path="/grades">
        <PrivateRoute component={Grades} />
      </Route>
      
      {/* Reports */}
      <Route path="/reports">
        <PrivateRoute component={Reports} roles={["admin"]} />
      </Route>
      
      {/* Settings */}
      <Route path="/settings">
        <PrivateRoute component={Settings} />
      </Route>
      
      {/* Home redirect */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Don't show sidebar on login page
  const showSidebar = isAuthenticated && location !== "/login";

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-neutral-50">
        {showSidebar && <Sidebar />}
        <div className="flex-1 overflow-y-auto pt-0 md:pt-0">
          {/* Mobile nav space filler */}
          <div className="h-16 md:hidden"></div>
          <main className="fade-in">
            <AppRoutes />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
