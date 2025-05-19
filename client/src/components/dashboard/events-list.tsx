import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: string | Date;
  endDate: string | Date;
  location: string | null;
  type: string;
}

interface EventsListProps {
  events: Event[];
  isLoading?: boolean;
}

export function EventsList({ events, isLoading = false }: EventsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-12 w-12 flex-shrink-0" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "academic":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
        };
      case "administrative":
        return {
          bg: "bg-primary-100",
          text: "text-primary-600",
        };
      case "extracurricular":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
        };
      default:
        return {
          bg: "bg-neutral-100",
          text: "text-neutral-600",
        };
    }
  };

  const getEventDate = (startDate: string | Date) => {
    const date = new Date(startDate);
    return format(date, "d");
  };

  const getEventTime = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if it's an all-day event
    if (
      start.getHours() === 0 && 
      start.getMinutes() === 0 && 
      end.getHours() === 23 && 
      end.getMinutes() === 59
    ) {
      return "All Day";
    }
    
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No upcoming events</p>
          ) : (
            events.map((event) => {
              const colors = getEventColor(event.type);
              return (
                <div key={event.id} className="flex items-start slide-in">
                  <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center`}>
                    <span className="font-semibold">{getEventDate(event.startDate)}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium">{event.title}</h3>
                    <p className="text-sm text-neutral-500">{getEventTime(event.startDate, event.endDate)}</p>
                    <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
