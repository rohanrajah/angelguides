import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChartIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  DollarSignIcon,
  UsersIcon,
  CalendarIcon,
  StarIcon,
  ClockIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdvisorDashboardLayout from "@/components/layout/AdvisorDashboardLayout";
import { useAuth } from "@/hooks/use-auth";

export default function AdvisorDashboard() {
  const { user } = useAuth();
  
  // Fetch advisor data including earnings and sessions
  const { data: advisorData, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });
  
  // Fetch advisor earnings data
  const { data: earningsData } = useQuery({
    queryKey: [`/api/advisors/${user?.id}/earnings`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });
  
  // Fetch recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: [`/api/advisors/${user?.id}/sessions?limit=5`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });

  if (isLoading) {
    return (
      <AdvisorDashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-96">Loading...</div>
      </AdvisorDashboardLayout>
    );
  }

  // Calculate earnings data
  const availableBalance = ((earningsData?.earningsBalance || 0) / 100).toFixed(2);
  const totalEarnings = ((earningsData?.totalEarnings || 0) / 100).toFixed(2);
  const pendingPayout = earningsData?.pendingPayout;
  
  // Calculate month-over-month growth (dummy data for now)
  const monthlyGrowth = 12.5; // percentage
  
  return (
    <AdvisorDashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
                <span className="text-2xl font-bold">${availableBalance}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingPayout 
                  ? "Payout request pending" 
                  : "Available for withdrawal"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChartIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span className="text-2xl font-bold">${totalEarnings}</span>
                {monthlyGrowth > 0 ? (
                  <span className="ml-2 flex items-center text-green-600 text-xs">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    {monthlyGrowth}%
                  </span>
                ) : (
                  <span className="ml-2 flex items-center text-red-600 text-xs">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    {Math.abs(monthlyGrowth)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs. last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-purple-600" />
                <span className="text-2xl font-bold">
                  {advisorData?.clientCount || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique clients served
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {advisorData?.rating ? (advisorData.rating / 100).toFixed(1) : "0.0"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {advisorData?.reviewCount || 0} reviews
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle Section - Stats and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Your most recent client sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Recent Sessions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentSessions || []).map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.userName}</TableCell>
                      <TableCell>
                        {new Date(session.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {session.sessionType === 'video' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Video</Badge>
                        ) : session.sessionType === 'audio' ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Audio</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">Chat</Badge>
                        )}
                      </TableCell>
                      <TableCell>{session.actualDuration || '--'} min</TableCell>
                      <TableCell>${((session.billedAmount || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        {session.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : session.status === 'in_progress' ? (
                          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                        ) : session.status === 'scheduled' ? (
                          <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentSessions || recentSessions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No recent sessions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">
                View All Sessions
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>
                Improve your visibility to potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Profile Completion</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckItem checked={!!advisorData?.bio} />
                      <span>Bio Information</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckItem checked={!!advisorData?.avatar} />
                      <span>Profile Picture</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckItem checked={!!advisorData?.introVideo} />
                      <span>Introduction Video</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckItem checked={advisorData?.specialties?.length > 0} />
                      <span>Specialties Listed</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckItem checked={!!advisorData?.chatRate} />
                      <span>Services & Rates</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" size="sm">
                  Complete Your Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>
              Your upcoming client sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Client Session #{i}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          <span>Today, {3 + i}:00 PM</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          <span>30 minutes</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Audio
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-sm">Client: John D.</span>
                      <Button size="sm" variant="outline">Join</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="ml-auto">
              View Full Schedule
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdvisorDashboardLayout>
  );
}

// Helper component for check items
function CheckItem({ checked }: { checked: boolean }) {
  return (
    <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-2 ${
      checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
    }`}>
      {checked ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-3 h-3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span className="text-xs">!</span>
      )}
    </div>
  );
}