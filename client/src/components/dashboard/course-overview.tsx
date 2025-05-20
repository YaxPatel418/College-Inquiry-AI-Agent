import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface CourseOverviewProps {
  courseStats: {
    active: {
      count: number;
      percentage: number;
    };
    pending: {
      count: number;
      percentage: number;
    };
    archived: {
      count: number;
      percentage: number;
    };
  };
  popularCourses: {
    id: number;
    code: string;
    title: string;
    studentCount: number;
  }[];
  isLoading?: boolean;
}

export function CourseOverview({ 
  courseStats, 
  popularCourses, 
  isLoading = false 
}: CourseOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-4 w-40 mt-4" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Course Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Courses */}
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold inline-block text-primary-600">
                  Active Courses
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {courseStats.active.percentage}%
                </span>
              </div>
            </div>
            <Progress value={courseStats.active.percentage} className="h-2 bg-primary-100" />
          </div>
          
          {/* Pending Courses */}
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold inline-block text-secondary-600">
                  Pending Courses
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-secondary-600">
                  {courseStats.pending.percentage}%
                </span>
              </div>
            </div>
            <Progress value={courseStats.pending.percentage} className="h-2 bg-secondary-100" indicatorClassname="bg-secondary-500" />
          </div>
          
          {/* Archived Courses */}
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold inline-block text-neutral-600">
                  Archived Courses
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-neutral-600">
                  {courseStats.archived.percentage}%
                </span>
              </div>
            </div>
            <Progress value={courseStats.archived.percentage} className="h-2 bg-neutral-100" indicatorClassname="bg-neutral-400" />
          </div>
          
          {/* Popular Courses */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Most Popular Courses</h3>
            <div className="space-y-3">
              {popularCourses.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No courses available</p>
              ) : (
                popularCourses.map((course) => (
                  <div key={course.id} className="p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-neutral-500">{course.studentCount} students</p>
                    </div>
                    <Link href={`/courses/${course.id}`} className="bg-primary-600 h-8 w-8 rounded-full flex items-center justify-center text-white">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
