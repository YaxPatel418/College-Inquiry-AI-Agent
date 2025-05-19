import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    trend: "up" | "down" | "neutral";
  };
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  iconColor = "text-primary-600",
  iconBgColor = "bg-primary-50",
  trend,
  isLoading = false,
}: StatCardProps) {
  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    if (trend === "up") return "text-success";
    if (trend === "down") return "text-error";
    return "text-neutral-500";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className={cn("p-3 rounded-lg", iconBgColor)}>
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-12 mt-1" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className={cn("p-3 rounded-lg", iconBgColor, iconColor)}>
              {icon}
            </div>
          )}
          <div className="ml-4">
            <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
            <p className="text-2xl font-semibold">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs flex items-center mt-1",
                  getTrendColor(trend.trend)
                )}
              >
                {trend.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : trend.trend === "down" ? (
                  <ArrowDown className="h-3 w-3 mr-1" />
                ) : null}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
