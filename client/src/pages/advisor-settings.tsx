import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  UserIcon,
  AtSignIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
  ClockIcon,
  CameraIcon,
  SaveIcon,
  KeyIcon,
  BellIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  AwardIcon,
  VideoIcon,
  MoonIcon,
  RefreshCcwIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland"
];

export default function AdvisorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    timezone: "",
    availability: "",
    languages: "",
    website: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailForBookings: true,
    emailForMessages: true,
    emailForReviews: true,
    emailForPayouts: true,
    smsForBookings: false,
    smsForMessages: false
  });

  // Fetch advisor data
  const { data: advisor, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
    onSuccess: (data) => {
      // Populate form with existing data
      setProfileForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        location: data.location || "",
        timezone: data.timezone || "America/New_York",
        availability: data.availability || "",
        languages: data.languages || "English",
        website: data.website || ""
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/users/profile`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Failed to upload avatar');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Failed to upload video');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Video Updated",
        description: "Your introduction video has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/users/change-password`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "There was an error updating your password.",
        variant: "destructive",
      });
    },
  });

  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/users/notifications`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your notification settings.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('video', file);
      uploadVideoMutation.mutate(formData);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationsMutation.mutate(notificationSettings);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how you appear to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="space-y-4 md:w-1/3">
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={user?.avatar || ""} alt={user?.name || "Advisor"} />
                        <AvatarFallback className="text-2xl">
                          {user?.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        ref={avatarFileRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => avatarFileRef.current?.click()}
                        className="mt-2"
                        disabled={uploadAvatarMutation.isPending}
                      >
                        <CameraIcon className="h-4 w-4 mr-2" />
                        {uploadAvatarMutation.isPending ? "Uploading..." : "Change Picture"}
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Introduction Video</Label>
                      <div className="border rounded p-4 flex flex-col items-center gap-2">
                        {advisor?.introVideo ? (
                          <>
                            <video 
                              src={`/api/files/${advisor.introVideo}`} 
                              controls 
                              className="w-full h-auto rounded"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => videoFileRef.current?.click()}
                              disabled={uploadVideoMutation.isPending}
                            >
                              <RefreshCcwIcon className="h-4 w-4 mr-1" />
                              Replace Video
                            </Button>
                          </>
                        ) : (
                          <>
                            <VideoIcon className="h-12 w-12 text-muted-foreground" />
                            <p className="text-sm text-center text-muted-foreground">
                              Upload a short introduction video to help clients get to know you
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => videoFileRef.current?.click()}
                              disabled={uploadVideoMutation.isPending}
                            >
                              <CameraIcon className="h-4 w-4 mr-2" />
                              {uploadVideoMutation.isPending ? "Uploading..." : "Upload Video"}
                            </Button>
                          </>
                        )}
                        <input
                          type="file"
                          ref={videoFileRef}
                          onChange={handleVideoChange}
                          className="hidden"
                          accept="video/*"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:w-2/3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          icon={<UserIcon className="h-4 w-4" />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          icon={<AtSignIcon className="h-4 w-4" />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          icon={<PhoneIcon className="h-4 w-4" />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                          icon={<MapPinIcon className="h-4 w-4" />}
                          placeholder="City, Country"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={profileForm.timezone} 
                          onValueChange={(value) => setProfileForm({...profileForm, timezone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="languages">Languages</Label>
                        <Input
                          id="languages"
                          value={profileForm.languages}
                          onChange={(e) => setProfileForm({...profileForm, languages: e.target.value})}
                          icon={<GlobeIcon className="h-4 w-4" />}
                          placeholder="English, Spanish, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="availability">Availability</Label>
                        <Input
                          id="availability"
                          value={profileForm.availability}
                          onChange={(e) => setProfileForm({...profileForm, availability: e.target.value})}
                          icon={<ClockIcon className="h-4 w-4" />}
                          placeholder="Mon-Fri, 9am-5pm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Website (Optional)</Label>
                        <Input
                          id="website"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                          icon={<GlobeIcon className="h-4 w-4" />}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        placeholder="Tell clients about your background, specialties, and approach..."
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your bio is displayed on your profile page and helps clients decide if you're the right advisor for them.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>Saving Changes...</>
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Certifications & Credentials</CardTitle>
              <CardDescription>
                Add professional certifications to showcase your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center p-3 border rounded">
                  <AwardIcon className="h-5 w-5 mr-3 text-yellow-500" />
                  <div>
                    <h3 className="font-medium">Certified Tarot Reader</h3>
                    <p className="text-sm text-muted-foreground">Issued by International Tarot Association - 2022</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <FileTextIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add New Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      icon={<KeyIcon className="h-4 w-4" />}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      icon={<KeyIcon className="h-4 w-4" />}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      icon={<KeyIcon className="h-4 w-4" />}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={
                      changePasswordMutation.isPending || 
                      !passwordForm.currentPassword || 
                      !passwordForm.newPassword || 
                      !passwordForm.confirmPassword
                    }
                  >
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Protect your account with an additional verification step
                  </p>
                </div>
                <Button variant="outline">Set Up</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
              <CardDescription>
                Manage devices where you're currently logged in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 border rounded">
                  <div>
                    <h3 className="font-medium">Chrome on Windows</h3>
                    <p className="text-xs text-muted-foreground">
                      Current Session • Last active just now
                    </p>
                  </div>
                  <Badge className="ml-auto">Current</Badge>
                </div>
                
                <div className="flex items-center p-3 border rounded">
                  <div>
                    <h3 className="font-medium">Safari on iPhone</h3>
                    <p className="text-xs text-muted-foreground">
                      Last active 3 days ago
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Log Out
                  </Button>
                </div>
                
                <Button variant="outline" className="w-full">
                  Log Out From All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure which emails you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotificationsSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Booking Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when a client books a session with you
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailForBookings}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, emailForBookings: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when you get a new message
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailForMessages}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, emailForMessages: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Review Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when a client leaves a review
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailForReviews}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, emailForReviews: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payout Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when a payout is processed
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailForPayouts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, emailForPayouts: checked})
                      }
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={updateNotificationsMutation.isPending}
                  >
                    {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Configure text message alerts (standard rates may apply)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Booking Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a text when a client books a session
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsForBookings}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, smsForBookings: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Message Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a text when you get a new message
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsForMessages}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, smsForMessages: checked})
                      }
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>
                Customize how AngelGuides.ai appears for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for reduced eye strain in low light
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Off</Label>
                    <Switch id="dark-mode" />
                    <Label>On</Label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Theme Color</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {["purple", "blue", "teal", "green", "rose"].map((color) => (
                      <div
                        key={color}
                        className={`h-10 rounded-md cursor-pointer border-2 ${
                          color === "purple" ? "border-purple-500" : "border-transparent"
                        }`}
                        style={{
                          backgroundColor:
                            color === "purple" ? "#8b5cf6" :
                            color === "blue" ? "#3b82f6" :
                            color === "teal" ? "#14b8a6" :
                            color === "green" ? "#22c55e" :
                            "#f43f5e"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>
                Customize accessibility settings for your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations throughout the interface
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Text Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select text size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="x-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}