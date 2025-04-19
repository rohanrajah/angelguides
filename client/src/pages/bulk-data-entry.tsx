import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserType } from "@shared/schema";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Define form schema
const bulkFormSchema = z.object({
  userCount: z.number().min(1).max(1000),
  advisorCount: z.number().min(1).max(100),
  adminCount: z.number().min(1).max(10),
  clearExisting: z.boolean().default(false),
});

type BulkFormValues = z.infer<typeof bulkFormSchema>;

// Define individual user form schema for manual entry
const userFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  userType: z.enum([UserType.USER, UserType.ADVISOR, UserType.ADMIN]),
  bio: z.string().optional(),
  chatRate: z.number().min(0).optional(),
  audioRate: z.number().min(0).optional(),
  videoRate: z.number().min(0).optional(),
  specialties: z.array(z.number()).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function BulkDataEntryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bulk");
  const [generating, setGenerating] = useState(false);
  
  // Define form for bulk generation
  const bulkForm = useForm<BulkFormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      userCount: 100,
      advisorCount: 50,
      adminCount: 2,
      clearExisting: false,
    },
  });
  
  // Define form for individual user entry
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      userType: UserType.USER,
      bio: "",
      chatRate: 0,
      audioRate: 0,
      videoRate: 0,
      specialties: [],
    },
  });
  
  // Watch the userType field to conditionally render advisor fields
  const watchedUserType = userForm.watch("userType");
  
  // Mutation for generating bulk data
  const generateDataMutation = useMutation({
    mutationFn: async (values: BulkFormValues) => {
      setGenerating(true);
      const response = await apiRequest("POST", "/api/admin/generate-data", values);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `Generated ${data.usersCreated} users, ${data.advisorsCreated} advisors, and ${data.adminsCreated} admins.`,
      });
      setGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
      setGenerating(false);
    },
  });
  
  // Mutation for creating a single user
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await apiRequest("POST", "/api/users", values);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User created!",
        description: `Successfully created ${data.name} (${data.userType})`,
      });
      userForm.reset();
    },
    onError: (error) => {
      toast({
        title: "User creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle bulk generation form submission
  const onBulkSubmit = (values: BulkFormValues) => {
    generateDataMutation.mutate(values);
  };
  
  // Handle individual user form submission
  const onUserSubmit = (values: UserFormValues) => {
    createUserMutation.mutate(values);
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Data Management</CardTitle>
          <CardDescription>
            Generate test data for your application or create individual users
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
              <TabsTrigger value="individual">Individual Entry</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Bulk Generation Tab */}
          <TabsContent value="bulk" className="p-6">
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={bulkForm.control}
                    name="userCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Users</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of regular users to generate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bulkForm.control}
                    name="advisorCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advisors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of advisor accounts to generate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bulkForm.control}
                    name="adminCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admins</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of admin accounts to generate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={bulkForm.control}
                  name="clearExisting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Clear existing data</FormLabel>
                        <FormDescription>
                          Warning: This will delete all existing users, advisors, and related data before generating new ones
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Data...
                    </>
                  ) : (
                    "Generate Test Data"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Individual Entry Tab */}
          <TabsContent value="individual" className="p-6">
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={userForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={userForm.control}
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
                    control={userForm.control}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={userForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Advisor Specific Fields */}
                {watchedUserType === UserType.ADVISOR && (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">Advisor Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={userForm.control}
                        name="chatRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chat Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1.99"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>In dollars (e.g. 1.99)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="audioRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audio Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="2.49"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>In dollars (e.g. 2.49)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="videoRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video Rate (per minute)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="3.99"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>In dollars (e.g. 3.99)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
                
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}