import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// User creation form schema
const userSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  userType: z.enum(['USER', 'ADVISOR', 'ADMIN']),
  bio: z.string().optional(),
  chatRate: z.number().optional(),
  audioRate: z.number().optional(),
  videoRate: z.number().optional(),
  profileCompleted: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [userType, setUserType] = useState<'USER' | 'ADVISOR' | 'ADMIN'>('USER');
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      userType: 'USER',
      bio: '',
      chatRate: 0,
      audioRate: 0,
      videoRate: 0,
      profileCompleted: false
    }
  });

  // Update form when userType changes
  React.useEffect(() => {
    form.setValue('userType', userType);
  }, [userType, form]);

  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      // Convert rates from dollars to cents
      if (values.chatRate) values.chatRate = Math.round(values.chatRate * 100);
      if (values.audioRate) values.audioRate = Math.round(values.audioRate * 100);
      if (values.videoRate) values.videoRate = Math.round(values.videoRate * 100);
      
      const res = await apiRequest('POST', '/api/users', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'User created successfully',
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Refresh user lists
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advisors'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating user',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: UserFormValues) {
    createUserMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User type selector */}
              <div className="col-span-2 mb-4">
                <FormLabel>User Type</FormLabel>
                <div className="flex space-x-4 mt-2">
                  <Button
                    type="button"
                    variant={userType === 'USER' ? 'default' : 'outline'}
                    onClick={() => setUserType('USER')}
                  >
                    Regular User
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'ADVISOR' ? 'default' : 'outline'}
                    onClick={() => setUserType('ADVISOR')}
                  >
                    Spiritual Advisor
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'ADMIN' ? 'default' : 'outline'}
                    onClick={() => setUserType('ADMIN')}
                  >
                    Administrator
                  </Button>
                </div>
              </div>

              {/* Basic Information Fields */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
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
                      <Input type="email" placeholder="email@example.com" {...field} />
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
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <FormLabel>Profile Completed</FormLabel>
                      <FormDescription>
                        Mark the profile as fully set up
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advisor-specific fields */}
              {userType === 'ADVISOR' && (
                <>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Advisor's biography and background" 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="chatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chat Rate ($ per minute)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Rate ($ per minute)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Rate ($ per minute)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}