import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MessageSquareIcon, // Using MessageSquareIcon instead of ChatIcon
  PhoneIcon,
  VideoIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  TagIcon,
  ClockIcon,
  DollarSignIcon,
  InfoIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdvisorServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editServiceType, setEditServiceType] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    type: "",
    rate: 0,
    description: "",
    isAvailable: true,
    minimumDuration: 5
  });

  // Fetch advisor data
  const { data: advisor, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/advisors/${user?.id}/services`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Service Updated",
        description: `Your ${serviceFormData.type.toLowerCase()} service has been updated.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}`] });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your service.",
        variant: "destructive",
      });
    },
  });

  const handleEditService = (type: string) => {
    setEditServiceType(type);
    
    let initialRate = 0;
    let initialDescription = "";
    let initialAvailability = true;
    let initialMinDuration = 5;
    
    if (type === "CHAT" && advisor) {
      initialRate = advisor.chatRate || 0;
      initialDescription = advisor.chatDescription || "";
      initialAvailability = advisor.isChatAvailable !== false;
      initialMinDuration = advisor.chatMinDuration || 5;
    } else if (type === "AUDIO" && advisor) {
      initialRate = advisor.audioRate || 0;
      initialDescription = advisor.audioDescription || "";
      initialAvailability = advisor.isAudioAvailable !== false;
      initialMinDuration = advisor.audioMinDuration || 5;
    } else if (type === "VIDEO" && advisor) {
      initialRate = advisor.videoRate || 0;
      initialDescription = advisor.videoDescription || "";
      initialAvailability = advisor.isVideoAvailable !== false;
      initialMinDuration = advisor.videoMinDuration || 5;
    }
    
    setServiceFormData({
      type,
      rate: initialRate / 100, // Convert cents to dollars for display
      description: initialDescription,
      isAvailable: initialAvailability,
      minimumDuration: initialMinDuration
    });
    
    setEditDialogOpen(true);
  };

  const handleUpdateService = () => {
    // Convert dollars to cents for storage
    const rateInCents = Math.round(serviceFormData.rate * 100);
    
    const updateData: any = {};
    
    if (serviceFormData.type === "CHAT") {
      updateData.chatRate = rateInCents;
      updateData.chatDescription = serviceFormData.description;
      updateData.isChatAvailable = serviceFormData.isAvailable;
      updateData.chatMinDuration = serviceFormData.minimumDuration;
    } else if (serviceFormData.type === "AUDIO") {
      updateData.audioRate = rateInCents;
      updateData.audioDescription = serviceFormData.description;
      updateData.isAudioAvailable = serviceFormData.isAvailable;
      updateData.audioMinDuration = serviceFormData.minimumDuration;
    } else if (serviceFormData.type === "VIDEO") {
      updateData.videoRate = rateInCents;
      updateData.videoDescription = serviceFormData.description;
      updateData.isVideoAvailable = serviceFormData.isAvailable;
      updateData.videoMinDuration = serviceFormData.minimumDuration;
    }
    
    updateServiceMutation.mutate(updateData);
  };

  const getServiceDetails = (type: string) => {
    if (!advisor) return { rate: 0, available: false, description: "" };
    
    switch (type) {
      case "chat":
        return {
          rate: advisor.chatRate || 0,
          available: advisor.isChatAvailable !== false,
          description: advisor.chatDescription || "Chat with clients through text messages.",
          minDuration: advisor.chatMinDuration || 5
        };
      case "audio":
        return {
          rate: advisor.audioRate || 0,
          available: advisor.isAudioAvailable !== false,
          description: advisor.audioDescription || "Voice readings with clear audio communication.",
          minDuration: advisor.audioMinDuration || 5
        };
      case "video":
        return {
          rate: advisor.videoRate || 0,
          available: advisor.isVideoAvailable !== false,
          description: advisor.videoDescription || "Face-to-face spiritual guidance through video.",
          minDuration: advisor.videoMinDuration || 5
        };
      default:
        return { rate: 0, available: false, description: "", minDuration: 5 };
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-muted-foreground">
            Manage your service offerings and pricing
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <InfoIcon className="h-4 w-4 mr-2" />
                Service Guidelines
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <p className="font-medium">Service Guidelines:</p>
              <ul className="text-sm list-disc pl-4 mt-1">
                <li>Set competitive rates based on your experience level.</li>
                <li>Ensure your service descriptions are clear and specific.</li>
                <li>All prices should be per minute rates.</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat Service Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MessageSquareIcon className="h-5 w-5 mr-2 text-purple-600" />
              Chat Readings
              {getServiceDetails("chat").available ? (
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
              ) : (
                <Badge className="ml-2 bg-gray-100 text-gray-800 hover:bg-gray-200" variant="outline">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Text-based spiritual guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <DollarSignIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>${(getServiceDetails("chat").rate / 100).toFixed(2)} per minute</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Minimum {getServiceDetails("chat").minDuration} minutes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getServiceDetails("chat").description}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleEditService("CHAT")}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Service
            </Button>
          </CardFooter>
        </Card>

        {/* Audio Service Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-blue-600" />
              Audio Readings
              {getServiceDetails("audio").available ? (
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
              ) : (
                <Badge className="ml-2 bg-gray-100 text-gray-800 hover:bg-gray-200" variant="outline">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Voice call spiritual sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <DollarSignIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>${(getServiceDetails("audio").rate / 100).toFixed(2)} per minute</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Minimum {getServiceDetails("audio").minDuration} minutes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getServiceDetails("audio").description}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleEditService("AUDIO")}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Service
            </Button>
          </CardFooter>
        </Card>

        {/* Video Service Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <VideoIcon className="h-5 w-5 mr-2 text-green-600" />
              Video Readings
              {getServiceDetails("video").available ? (
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
              ) : (
                <Badge className="ml-2 bg-gray-100 text-gray-800 hover:bg-gray-200" variant="outline">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Face-to-face video sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <DollarSignIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>${(getServiceDetails("video").rate / 100).toFixed(2)} per minute</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Minimum {getServiceDetails("video").minDuration} minutes</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getServiceDetails("video").description}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleEditService("VIDEO")}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Service
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Specialties & Expertise</CardTitle>
          <CardDescription>
            Manage your specialties to attract the right clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(advisor?.specialties || []).map((specialty: any, index: number) => (
                <Badge key={index} variant="outline" className="px-3 py-1 text-sm">
                  {specialty.name}
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-2">
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button variant="outline" size="sm" className="flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Specialty
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Top Rated Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center p-2 border rounded">
                  <TagIcon className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="text-sm">Tarot Reading</span>
                  <div className="ml-auto flex items-center">
                    <StarRating rating={4.9} />
                  </div>
                </div>
                <div className="flex items-center p-2 border rounded">
                  <TagIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Astrology</span>
                  <div className="ml-auto flex items-center">
                    <StarRating rating={4.7} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {serviceFormData.type === "CHAT" ? "Chat" : 
                   serviceFormData.type === "AUDIO" ? "Audio" : 
                   "Video"} Service
            </DialogTitle>
            <DialogDescription>
              Update your service details and pricing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="service-active">Active Service</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        When disabled, clients cannot book this service with you.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch 
                id="service-active"
                checked={serviceFormData.isAvailable}
                onCheckedChange={(checked) => 
                  setServiceFormData({...serviceFormData, isAvailable: checked})
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price-per-minute">Price Per Minute ($)</Label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="price-per-minute"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9"
                  value={serviceFormData.rate}
                  onChange={(e) => 
                    setServiceFormData({...serviceFormData, rate: parseFloat(e.target.value) || 0})
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Clients will be charged this amount per minute during the session.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimum-duration">Minimum Duration (minutes)</Label>
              <Input 
                id="minimum-duration"
                type="number"
                min="1"
                value={serviceFormData.minimumDuration}
                onChange={(e) => 
                  setServiceFormData({...serviceFormData, minimumDuration: parseInt(e.target.value) || 5})
                }
              />
              <p className="text-sm text-muted-foreground">
                The minimum session length clients must book.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-description">Service Description</Label>
              <Textarea 
                id="service-description"
                placeholder="Describe your service..."
                value={serviceFormData.description}
                onChange={(e) => 
                  setServiceFormData({...serviceFormData, description: e.target.value})
                }
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Help clients understand what they'll receive with this service.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateService}
              disabled={updateServiceMutation.isPending}
            >
              {updateServiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for displaying star ratings
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      <div className="flex mr-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating)
                ? "text-yellow-400 fill-yellow-400"
                : star <= rating
                ? "text-yellow-400 fill-yellow-400" // For partial stars, we could use a more complex SVG
                : "text-gray-300"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};