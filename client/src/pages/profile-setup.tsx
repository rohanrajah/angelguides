import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UploadIcon } from "lucide-react";
import { UserType } from "@shared/schema";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Form schema for profile setup
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.number()).optional(),
  chatRate: z.number().min(0).optional(),
  audioRate: z.number().min(0).optional(),
  videoRate: z.number().min(0).optional(),
  userType: z.string(),
  avatar: z.string().optional(),
  introVideo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Fetch current user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/me");
      return await res.json();
    }
  });
  
  // Fetch specialties for advisors
  const { data: specialties, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["/api/specialties"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/specialties");
      return await res.json();
    }
  });
  
  // Form default values
  const defaultValues: Partial<ProfileFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    specialties: user?.specialties || [],
    chatRate: user?.chatRate || 0,
    audioRate: user?.audioRate || 0,
    videoRate: user?.videoRate || 0,
    userType: user?.userType || UserType.USER,
    avatar: user?.avatar || "",
    introVideo: user?.introVideo || "",
  };
  
  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        specialties: user.specialties || [],
        chatRate: user.chatRate || 0,
        audioRate: user.audioRate || 0,
        videoRate: user.videoRate || 0,
        userType: user.userType || UserType.USER,
        avatar: user.avatar || "",
        introVideo: user.introVideo || "",
      });
      
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      
      // Update the form value
      form.setValue("avatar", "pending-upload");
    }
  };
  
  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      
      // Update the form value
      form.setValue("introVideo", "pending-upload");
    }
  };
  
  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!avatarFile) return null;
      
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      
      const res = await apiRequest("POST", "/api/upload/avatar", formData);
      return await res.json();
    }
  });
  
  // Upload intro video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile) return null;
      
      const formData = new FormData();
      formData.append("video", videoFile);
      
      const res = await apiRequest("POST", "/api/upload/video", formData);
      return await res.json();
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/users/profile", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({queryKey: ["/api/me"]});
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const avatarResult = await uploadAvatarMutation.mutateAsync();
        if (avatarResult?.url) {
          values.avatar = avatarResult.url;
        }
      }
      
      // Upload intro video if changed (only for advisors)
      if (videoFile && values.userType === UserType.ADVISOR) {
        const videoResult = await uploadVideoMutation.mutateAsync();
        if (videoResult?.url) {
          values.introVideo = videoResult.url;
        }
      }
      
      // Mark profile as completed
      const updateData = {
        ...values,
        profileCompleted: true
      };
      
      // Update profile
      await updateProfileMutation.mutateAsync(updateData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    }
  };
  
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile Setup</CardTitle>
          <CardDescription>
            Complete your profile information to get started with AngelGuides.ai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  {form.getValues("userType") === UserType.ADVISOR && (
                    <TabsTrigger value="advisor">Advisor Details</TabsTrigger>
                  )}
                  <TabsTrigger value="media">Profile Media</TabsTrigger>
                </TabsList>
                
                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={user?.userType === UserType.ADMIN}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={UserType.USER}>Regular User</SelectItem>
                                <SelectItem value={UserType.ADVISOR}>Advisor</SelectItem>
                                {user?.userType === UserType.ADMIN && (
                                  <SelectItem value={UserType.ADMIN}>Administrator</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {field.value === UserType.ADVISOR 
                                ? "As an advisor, you'll be able to offer spiritual guidance to users."
                                : "As a user, you can book sessions with our advisors."}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="w-32 flex flex-col items-center">
                      <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-center block">Profile Photo</FormLabel>
                            <FormControl>
                              <div className="w-32 h-32 relative">
                                <Avatar className="w-32 h-32">
                                  <AvatarImage src={avatarPreview || ""} />
                                  <AvatarFallback className="text-2xl">
                                    {user?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                  <label 
                                    htmlFor="avatar-upload" 
                                    className="cursor-pointer text-white flex flex-col items-center"
                                  >
                                    <UploadIcon className="h-8 w-8" />
                                    <span className="text-xs mt-1">Upload</span>
                                  </label>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                  />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your profile page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Advisor Details */}
                {form.getValues("userType") === UserType.ADVISOR && (
                  <TabsContent value="advisor" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={(value) => {
                                const specialty = parseInt(value);
                                // Add to array if not already present
                                if (!field.value?.includes(specialty)) {
                                  field.onChange([...(field.value || []), specialty]);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your specialties" />
                              </SelectTrigger>
                              <SelectContent>
                                {specialties?.map((specialty: any) => (
                                  <SelectItem key={specialty.id} value={specialty.id.toString()}>
                                    {specialty.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value?.map((specialtyId) => {
                              const specialty = specialties?.find((s: any) => s.id === specialtyId);
                              return specialty ? (
                                <div 
                                  key={specialtyId}
                                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
                                >
                                  {specialty.name}
                                  <button
                                    type="button"
                                    className="ml-2 text-primary hover:text-primary/80"
                                    onClick={() => {
                                      field.onChange(field.value?.filter(id => id !== specialtyId));
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <FormDescription>
                            Select the areas in which you specialize as an advisor.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="chatRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chat Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1"
                                placeholder="150" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Your rate for text chat sessions in cents per minute.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="audioRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audio Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1"
                                placeholder="200" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Your rate for audio call sessions in cents per minute.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="videoRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1"
                                placeholder="250" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Your rate for video call sessions in cents per minute.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                )}
                
                {/* Profile Media */}
                <TabsContent value="media" className="space-y-4 mt-4">
                  {form.getValues("userType") === UserType.ADVISOR && (
                    <FormField
                      control={form.control}
                      name="introVideo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Introduction Video (Advisors Only)</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              {field.value && field.value !== "pending-upload" ? (
                                <div>
                                  <video 
                                    controls 
                                    className="max-w-full h-auto mx-auto max-h-[240px]"
                                    src={field.value}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => {
                                      setVideoFile(null);
                                      field.onChange("");
                                    }}
                                  >
                                    Remove Video
                                  </Button>
                                </div>
                              ) : videoFile ? (
                                <div>
                                  <p className="text-green-600">Video selected: {videoFile.name}</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => {
                                      setVideoFile(null);
                                      field.onChange("");
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <label className="cursor-pointer block">
                                  <UploadIcon className="h-12 w-12 mx-auto text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-600">
                                    Upload a short video (max 1 minute) introducing yourself and your services.
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Supported formats: MP4, WebM, MOV (max 50MB)
                                  </p>
                                  <Button type="button" variant="outline" className="mt-2">
                                    Select Video
                                  </Button>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                  />
                                </label>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            A short video introduction helps potential clients connect with you before booking.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between">
                {activeTab === "basic" ? (
                  <div></div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentIndex = ["basic", "advisor", "media"].indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(["basic", "advisor", "media"][currentIndex - 1]);
                      }
                    }}
                  >
                    Previous
                  </Button>
                )}
                
                {activeTab === "media" ? (
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadVideoMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Profile"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      const currentIndex = ["basic", "advisor", "media"].indexOf(activeTab);
                      const nextTab = ["basic", "advisor", "media"][currentIndex + 1];
                      if (nextTab === "advisor" && form.getValues("userType") !== UserType.ADVISOR) {
                        setActiveTab("media");
                      } else {
                        setActiveTab(nextTab);
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}