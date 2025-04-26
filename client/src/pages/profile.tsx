import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Session } from '@shared/schema';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import SpiritualProfileSection from '@/components/astrology/SpiritualProfileSection';

const Profile: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'sessions' | 'spiritual' | 'preferences'>('profile');
  const [statusIsUpdating, setStatusIsUpdating] = useState(false);
  
  // Fetch current user
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  // Fetch user's sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<(Session & { advisor?: User })[]>({
    queryKey: [`/api/users/${currentUser?.id || 5}/sessions`],
    enabled: !!currentUser,
  });
  
  const handleStatusToggle = async () => {
    if (!currentUser) return;
    
    setStatusIsUpdating(true);
    
    try {
      const response = await apiRequest('PATCH', `/api/users/${currentUser.id}/status`, {
        online: !currentUser.online
      });
      
      // Invalidate user cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
      toast({
        title: "Status Updated",
        description: `You are now ${!currentUser.online ? 'online' : 'offline'}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your status.",
        variant: "destructive"
      });
    } finally {
      setStatusIsUpdating(false);
    }
  };
  
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-40 bg-neutral-light rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-80 bg-neutral-light rounded-xl"></div>
            <div className="md:col-span-2 h-80 bg-neutral-light rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="text-neutral mb-4">
            <i className="fas fa-user-slash text-4xl"></i>
          </div>
          <h2 className="font-heading text-2xl font-semibold mb-4">User Not Found</h2>
          <p className="text-neutral-dark mb-6">
            We couldn't find your user profile. Please try logging in again.
          </p>
          <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md transition duration-200">
            Log In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile header */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-6">
          <div className="h-40 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
            <div className="absolute -bottom-16 left-6 md:left-10">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-neutral-light">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white text-4xl font-heading">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <button className="bg-white/80 hover:bg-white text-neutral-dark rounded-md px-3 py-1.5 text-sm backdrop-blur-sm transition duration-200">
                <i className="fas fa-camera mr-1"></i>
                Edit Cover
              </button>
            </div>
          </div>
          <div className="pt-20 pb-5 px-6 md:px-10">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h1 className="font-heading text-2xl font-semibold text-neutral-darkest">{currentUser.name}</h1>
                <p className="text-neutral-dark">{currentUser.email}</p>
              </div>
              <div className="flex items-center mt-4 md:mt-0">
                <div className="mr-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={currentUser.online}
                      onChange={handleStatusToggle}
                      disabled={statusIsUpdating}
                    />
                    <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-success peer-focus:ring-4 peer-focus:ring-primary/20 peer-disabled:opacity-50"></div>
                    <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-neutral-dark">
                      {statusIsUpdating 
                        ? <i className="fas fa-spinner fa-spin"></i> 
                        : currentUser.online ? 'Online' : 'Offline'}
                    </span>
                  </label>
                </div>
                <motion.button 
                  className="bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 transition duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Profile
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile tabs */}
        <div className="mb-6 border-b border-neutral-light">
          <div className="flex overflow-x-auto">
            <motion.button 
              className={`py-3 px-5 font-medium ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
              onClick={() => setActiveTab('profile')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <i className="fas fa-user mr-2"></i>
              Profile
            </motion.button>
            <motion.button 
              className={`py-3 px-5 font-medium ${activeTab === 'sessions' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
              onClick={() => setActiveTab('sessions')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Sessions History
            </motion.button>
            <motion.button 
              className={`py-3 px-5 font-medium ${activeTab === 'spiritual' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
              onClick={() => setActiveTab('spiritual')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <i className="fas fa-star mr-2"></i>
              Spiritual Profile
            </motion.button>
            <motion.button 
              className={`py-3 px-5 font-medium ${activeTab === 'preferences' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
              onClick={() => setActiveTab('preferences')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <i className="fas fa-cog mr-2"></i>
              Preferences
            </motion.button>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:order-2 md:col-span-1">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-6">
              <div className="p-5 border-b border-neutral-light">
                <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Spiritual Journey</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-neutral-dark">Sessions Completed</span>
                      <span className="text-sm font-medium text-primary">42%</span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                    <p className="text-xs text-neutral mt-1">21 of 50 recommended sessions</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-neutral-dark">Meditation Practice</span>
                      <span className="text-sm font-medium text-secondary">65%</span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-neutral mt-1">13 hours of 20 hour goal</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-neutral-dark">Spiritual Growth</span>
                      <span className="text-sm font-medium text-accent">78%</span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <p className="text-xs text-neutral mt-1">Based on advisor assessments</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="p-5 border-b border-neutral-light">
                <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Favorite Advisors</h2>
              </div>
              <div className="p-5">
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group sessions by advisor and sort by count */}
                    {Object.values(
                      sessions.reduce((acc: Record<number, { advisor?: User, count: number }>, session) => {
                        if (!session.advisor) return acc;
                        
                        if (!acc[session.advisor.id]) {
                          acc[session.advisor.id] = { advisor: session.advisor, count: 0 };
                        }
                        acc[session.advisor.id].count++;
                        
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map(({ advisor, count }) => advisor && (
                        <div key={advisor.id} className="flex items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                            <img 
                              src={advisor.avatar || "https://via.placeholder.com/100"} 
                              alt={advisor.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-neutral-darkest">{advisor.name}</h3>
                            <p className="text-xs text-neutral-dark">{count} sessions</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-neutral-dark text-sm italic">
                    You haven't had any sessions with advisors yet.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:order-1 md:col-span-2">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <div className="p-5 border-b border-neutral-light">
                  <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Personal Information</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={currentUser.name} 
                        className="w-full px-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={currentUser.email} 
                        className="w-full px-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-1">Username</label>
                      <input 
                        type="text" 
                        value={currentUser.username} 
                        className="w-full px-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-1">Bio</label>
                      <textarea 
                        value={currentUser.bio || "Tell us about yourself and your spiritual journey..."}
                        rows={4}
                        className="w-full px-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 resize-none"
                        readOnly
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'sessions' && (
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <div className="p-5 border-b border-neutral-light">
                  <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Sessions History</h2>
                </div>
                <div className="p-5">
                  {sessionsLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-neutral-light rounded-md"></div>
                      ))}
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map(session => (
                        <div key={session.id} className="border border-neutral-light rounded-md p-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div className="flex items-start">
                              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                <img 
                                  src={session.advisor?.avatar || "https://via.placeholder.com/50"} 
                                  alt={session.advisor?.name || "Advisor"} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium text-neutral-darkest">
                                  Session with {session.advisor?.name || "Advisor"}
                                </h3>
                                <p className="text-sm text-neutral-dark">
                                  <i className="far fa-clock mr-1"></i>
                                  {format(new Date(session.startTime), 'MMM d, yyyy')} • {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                                </p>
                                {session.notes && (
                                  <p className="text-xs text-neutral mt-1">
                                    <i className="far fa-sticky-note mr-1"></i>
                                    {session.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex mt-3 sm:mt-0">
                              <span className={`text-xs rounded-full px-2 py-1 ${
                                session.status === 'completed' 
                                  ? 'bg-success/10 text-success' 
                                  : session.status === 'canceled' 
                                    ? 'bg-error/10 text-error'
                                    : 'bg-primary/10 text-primary'
                              }`}>
                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-neutral mb-3">
                        <i className="far fa-calendar-alt text-4xl"></i>
                      </div>
                      <h3 className="font-heading text-lg font-medium mb-2">No Sessions Yet</h3>
                      <p className="text-neutral-dark text-sm mb-4">
                        You haven't had any sessions with our advisors yet.
                      </p>
                      <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition duration-200">
                        Book Your First Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'spiritual' && (
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <div className="p-5 border-b border-neutral-light">
                  <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Spiritual Profile</h2>
                </div>
                <div className="p-5">
                  <SpiritualProfileSection user={currentUser} isEditable={true} />
                </div>
              </div>
            )}
            
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <div className="p-5 border-b border-neutral-light">
                  <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Account Preferences</h2>
                </div>
                <div className="p-5">
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-medium text-neutral-darkest mb-3">Notification Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-dark">Email Notifications</p>
                            <p className="text-xs text-neutral">Receive emails about your sessions and messages</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-primary"></div>
                            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-dark">Session Reminders</p>
                            <p className="text-xs text-neutral">Receive reminders before your upcoming sessions</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-primary"></div>
                            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-dark">Marketing Communications</p>
                            <p className="text-xs text-neutral">Receive updates about new features and promotions</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-primary"></div>
                            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-neutral-light">
                      <h3 className="font-medium text-neutral-darkest mb-3">Privacy Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-dark">Profile Visibility</p>
                            <p className="text-xs text-neutral">Allow advisors to see your profile information</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-primary"></div>
                            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-dark">Online Status</p>
                            <p className="text-xs text-neutral">Show when you're online to advisors</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-neutral-light rounded-full peer-checked:bg-primary"></div>
                            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-neutral-light">
                      <h3 className="font-medium text-neutral-darkest mb-3">Account Security</h3>
                      <div className="space-y-3">
                        <button className="text-primary hover:text-primary-dark font-medium text-sm transition duration-200">
                          <i className="fas fa-lock mr-2"></i>
                          Change Password
                        </button>
                        <button className="text-primary hover:text-primary-dark font-medium text-sm transition duration-200">
                          <i className="fas fa-shield-alt mr-2"></i>
                          Enable Two-Factor Authentication
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-neutral-light">
                    <motion.button 
                      className="bg-primary hover:bg-primary-dark text-white rounded-md px-5 py-2.5 transition duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Save Preferences
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
