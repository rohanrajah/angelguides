import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  CalendarIcon, 
  RefreshCwIcon,
  DownloadIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Users2Icon,
  ClockIcon,
  DollarSignIcon,
  StarIcon,
  TrendingUpIcon,
  AwardIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// Colors for charts
const COLORS = ["#8b5cf6", "#60a5fa", "#34d399", "#f87171", "#fbbf24", "#9333ea"];

export default function AdvisorStatistics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30days");

  // Fetch advisor's statistics
  const { data: statsData, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}/stats`, timeRange],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });

  // Sample data for charts (would come from the API in production)
  const earningsData = [
    { name: "Jan", earnings: 4200 },
    { name: "Feb", earnings: 3800 },
    { name: "Mar", earnings: 5100 },
    { name: "Apr", earnings: 5800 },
    { name: "May", earnings: 4900 },
    { name: "Jun", earnings: 6300 },
    { name: "Jul", earnings: 7100 },
  ];

  const sessionTypeData = [
    { name: "Chat", value: 45 },
    { name: "Audio", value: 30 },
    { name: "Video", value: 25 },
  ];

  const clientRetentionData = [
    { name: "New", value: 65 },
    { name: "Returning", value: 35 },
  ];

  const sessionsPerDayData = [
    { day: "Mon", sessions: 8 },
    { day: "Tue", sessions: 10 },
    { day: "Wed", sessions: 12 },
    { day: "Thu", sessions: 9 },
    { day: "Fri", sessions: 11 },
    { day: "Sat", sessions: 15 },
    { day: "Sun", sessions: 7 },
  ];

  const ratingDistributionData = [
    { rating: "5 Stars", count: 67 },
    { rating: "4 Stars", count: 22 },
    { rating: "3 Stars", count: 8 },
    { rating: "2 Stars", count: 2 },
    { rating: "1 Star", count: 1 },
  ];

  const renderTimeRangeBadge = () => {
    let label = "";
    switch (timeRange) {
      case "7days":
        label = "Last 7 Days";
        break;
      case "30days":
        label = "Last 30 Days";
        break;
      case "90days":
        label = "Last 90 Days";
        break;
      case "year":
        label = "Last Year";
        break;
      case "all":
        label = "All Time";
        break;
      default:
        label = "Custom";
    }
    
    return (
      <Badge variant="outline" className="ml-2">
        {label}
      </Badge>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {`${payload[0].name}: $${payload[0].value}`}
          </p>
        </div>
      );
    }
  
    return null;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statistics & Analytics</h1>
          <p className="text-muted-foreground">
            Track your performance and growth
            {renderTimeRangeBadge()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Tabs defaultValue="30days" value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7days">7d</TabsTrigger>
              <TabsTrigger value="30days">30d</TabsTrigger>
              <TabsTrigger value="90days">90d</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Earnings</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold">$5,832</h3>
                  <span className="ml-2 text-xs font-medium text-green-600 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    12%
                  </span>
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <DollarSignIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Sessions</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold">142</h3>
                  <span className="ml-2 text-xs font-medium text-green-600 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    8%
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users2Icon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Avg. Session Length</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold">24 min</h3>
                  <span className="ml-2 text-xs font-medium text-red-600 flex items-center">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    3%
                  </span>
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <ClockIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Average Rating</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold">4.8</h3>
                  <div className="ml-2 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon 
                        key={i} 
                        className={`h-4 w-4 ${i < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <StarIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings over time */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
            <CardDescription>
              Your earnings trend for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }}
                    name="Earnings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sessions by day of week */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions by Day of Week</CardTitle>
            <CardDescription>
              Distribution of your sessions across weekdays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Session type distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Session Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of different session types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rating distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              Breakdown of ratings received from clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={ratingDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="rating" type="category" width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth and performance insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key insights to help you improve your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col space-y-3 p-4 border rounded-lg">
              <div className="flex items-center">
                <TrendingUpIcon className="h-5 w-5 mr-2 text-green-600" />
                <h3 className="font-medium">Growth Opportunity</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Your video sessions have a 40% higher average length. Consider 
                promoting this service more to increase earnings.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 p-4 border rounded-lg">
              <div className="flex items-center">
                <AwardIcon className="h-5 w-5 mr-2 text-purple-600" />
                <h3 className="font-medium">Top Performance</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Your average rating for Tarot readings is 4.9 stars, making this 
                your highest-rated specialty.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 p-4 border rounded-lg">
              <div className="flex items-center">
                <Users2Icon className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">Client Insight</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                80% of your returning clients book on weekends. Consider 
                increasing your availability during these times.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}