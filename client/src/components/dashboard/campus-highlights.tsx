import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CampusHighlights() {
  // Campus photos
  const photos = [
    {
      src: "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      alt: "University building with modern architecture",
    },
    {
      src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      alt: "University library interior with students studying",
    },
    {
      src: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      alt: "College campus with trees and walking paths",
    },
    {
      src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      alt: "Students in classroom setting",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Campus Highlights</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              <img 
                src={photo.src} 
                alt={photo.alt} 
                className="w-full h-32 object-cover"
              />
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          className="mt-4 w-full py-2 text-neutral-700 hover:bg-neutral-200 text-sm font-medium"
        >
          View All Photos
        </Button>
      </CardContent>
    </Card>
  );
}
