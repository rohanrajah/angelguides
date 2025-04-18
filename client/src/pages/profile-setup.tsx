import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UserType, SpecialtyCategory } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';

// Define the profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.number()).optional(),
  chatRate: z.coerce.number().min(0).optional(),
  audioRate: z.coerce.number().min(0).optional(),
  videoRate: z.coerce.number().min(0).optional(),
  userType: z.enum([UserType.USER, UserType.ADVISOR, UserType.ADMIN]),
  avatar: z.any().optional(), // Will be handled separately
  introVideo: z.any().optional(), // Will be handled separately
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSetup() {
  const [selectedTab, setSelectedTab] = useState("basic");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [introVideo, setIntroVideo] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
  });

  // Fetch specialties for advisor profiles
  const { data: specialties = [] } = useQuery({
    queryKey: ['/api/specialties'],
    enabled: currentUser?.userType === UserType.ADVISOR,
  });

  // Determine if user is admin
  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const isAdvisor = currentUser?.userType === UserType.ADVISOR;

  // Initialize form with existing user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
      specialties: currentUser?.specialties || [],
      chatRate: currentUser?.chatRate || 100, // Default to $1.00 per minute
      audioRate: currentUser?.audioRate || 150, // Default to $1.50 per minute
      videoRate: currentUser?.videoRate || 200, // Default to $2.00 per minute
      userType: currentUser?.userType || UserType.USER,
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        specialties: currentUser.specialties || [],
        chatRate: currentUser.chatRate || 100,
        audioRate: currentUser.audioRate || 150,
        videoRate: currentUser.videoRate || 200,
        userType: currentUser.userType || UserType.USER,
      });
      
      if (currentUser.avatar) {
        setAvatarPreview(currentUser.avatar);
      }
    }
  }, [currentUser, form]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle intro video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIntroVideo(e.target.files[0]);
    }
  };

  // Handle profile update submission
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      // First, upload avatar if it exists
      let avatarUrl = currentUser?.avatar;
      if (avatar) {
        const formData = new FormData();
        formData.append('file', avatar);
        
        const avatarResponse = await apiRequest('POST', '/api/upload/avatar', formData, true);
        if (!avatarResponse.ok) {
          throw new Error('Failed to upload profile picture');
        }
        const avatarData = await avatarResponse.json();
        avatarUrl = avatarData.url;
      }
      
      // Next, upload intro video if it exists (for advisors only)
      let videoUrl = currentUser?.introVideo;
      if (introVideo && (isAdvisor || values.userType === UserType.ADVISOR)) {
        setVideoUploading(true);
        const videoFormData = new FormData();
        videoFormData.append('file', introVideo);
        
        const videoResponse = await apiRequest('POST', '/api/upload/video', videoFormData, true);
        setVideoUploading(false);
        
        if (!videoResponse.ok) {
          throw new Error('Failed to upload intro video');
        }
        const videoData = await videoResponse.json();
        videoUrl = videoData.url;
      }
      
      // Finally, update the user profile
      const profileData = {
        ...values,
        avatar: avatarUrl,
        introVideo: videoUrl,
        profileCompleted: true
      };
      
      const response = await apiRequest('PATCH', '/api/users/profile', profileData);
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
      // Redirect to appropriate page
      if (isAdmin) {
        setLocation('/admin/dashboard');
      } else if (isAdvisor) {
        setLocation('/advisor/dashboard');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update profile: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Display loading state
  if (userLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-3xl animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="h-60 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">Profile Setup</CardTitle>
          <CardDescription className="text-gray-100">
            Complete your profile to get the most out of Angel Guides
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  {(isAdvisor || form.getValues('userType') === UserType.ADVISOR) && (
                    <TabsTrigger value="advisor">Advisor Details</TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="admin">Admin Controls</TabsTrigger>
                  )}
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6 pt-4">
                  {/* User Type Selection (Admin only) */}
                  {isAdmin && (
                    <FormField
                      control={form.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserType.USER}>Regular User</SelectItem>
                              <SelectItem value={UserType.ADVISOR}>Advisor</SelectItem>
                              <SelectItem value={UserType.ADMIN}>Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Only administrators can change user types
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormDescription>
                          We'll never share your phone number with others
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Picture */}
                  <div className="space-y-2">
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Avatar preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-4xl">👤</div>
                        )}
                      </div>
                      <div>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarChange}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a square image, max 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Advisor Details Tab */}
                <TabsContent value="advisor" className="space-y-6 pt-4">
                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell clients about yourself, your experience, and your spiritual abilities..." 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your bio helps clients decide if you're the right advisor for them
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Specialties */}
                  <div className="space-y-2">
                    <FormLabel>Specialties</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {specialties.map((specialty) => (
                        <div key={specialty.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`specialty-${specialty.id}`}
                            checked={form.getValues('specialties')?.includes(specialty.id)}
                            onCheckedChange={(checked) => {
                              const currentSpecialties = form.getValues('specialties') || [];
                              if (checked) {
                                form.setValue('specialties', [...currentSpecialties, specialty.id]);
                              } else {
                                form.setValue(
                                  'specialties', 
                                  currentSpecialties.filter(id => id !== specialty.id)
                                );
                              }
                            }}
                          />
                          <label 
                            htmlFor={`specialty-${specialty.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {specialty.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormDescription>
                      Select the areas you specialize in
                    </FormDescription>
                  </div>

                  {/* Rates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="chatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Rate (¢/min)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price per minute for text chat
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
                          <FormLabel>Audio Rate (¢/min)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price per minute for voice calls
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
                          <FormLabel>Video Rate (¢/min)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price per minute for video calls
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Intro Video */}
                  <div className="space-y-2">
                    <FormLabel>Introduction Video (1 minute max)</FormLabel>
                    <Input 
                      type="file" 
                      accept="video/*" 
                      onChange={handleVideoChange}
                    />
                    <FormDescription>
                      Upload a brief video introduction to showcase your personality and abilities
                    </FormDescription>
                    {currentUser?.introVideo && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Current video:</p>
                        <video 
                          src={currentUser.introVideo} 
                          controls 
                          className="max-w-full h-auto rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Admin Controls Tab */}
                {isAdmin && (
                  <TabsContent value="admin" className="space-y-6 pt-4">
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                      <h3 className="text-lg font-medium text-yellow-800">Administrator Access</h3>
                      <p className="text-yellow-700 mt-1">
                        As an admin, you have full access to all parts of the system. Use these powers responsibly.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">User Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500">
                            You can manage all users, change their roles, and access their data from the Admin Dashboard.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setLocation('/admin/users')}
                            type="button"
                          >
                            Manage Users
                          </Button>
                        </CardFooter>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">System Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500">
                            Configure global settings, integrations, and other system parameters.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setLocation('/admin/settings')}
                            type="button"
                          >
                            System Settings
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
              
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  disabled={updateProfileMutation.isPending || videoUploading}
                >
                  {updateProfileMutation.isPending || videoUploading ? (
                    <>
                      <span className="mr-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      {videoUploading ? 'Uploading Video...' : 'Saving...'}
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}