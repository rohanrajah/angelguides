import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  CalendarIcon, 
  SearchIcon,
  FilterIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

export default function AdvisorOrdersHistory() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ field: "date", direction: "desc" });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Fetch advisor sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}/sessions`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });

  const handleSort = (field: string) => {
    if (sort.field === field) {
      setSort({
        ...sort,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ field, direction: "desc" });
    }
  };

  const filteredSessions = React.useMemo(() => {
    if (!sessions) return [];

    let filtered = [...sessions];
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (session) => 
          session.userId.toString().includes(searchLower) ||
          session.id.toString().includes(searchLower) ||
          (session.notes && session.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply filter
    if (filter !== "all") {
      filtered = filtered.filter((session) => session.status === filter);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let aValue = a[sort.field as keyof typeof a];
      let bValue = b[sort.field as keyof typeof b];
      
      if (sort.field === "date") {
        aValue = new Date(a.startTime).getTime();
        bValue = new Date(b.startTime).getTime();
      }
      
      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [sessions, search, filter, sort]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil((filteredSessions?.length || 0) / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const renderSortIcon = (field: string) => {
    if (sort.field !== field) return null;
    
    return sort.direction === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders History</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            icon={<SearchIcon className="h-4 w-4 opacity-50" />}
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  Order ID {renderSortIcon("id")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  Date {renderSortIcon("date")}
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No orders found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">#{session.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(session.startTime).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>Client #{session.userId}</TableCell>
                    <TableCell>
                      {session.sessionType === "CHAT" && "Chat Reading"}
                      {session.sessionType === "AUDIO" && "Voice Reading"}
                      {session.sessionType === "VIDEO" && "Video Reading"}
                    </TableCell>
                    <TableCell>
                      {session.actualDuration 
                        ? `${session.actualDuration} min` 
                        : (session.startTime && session.endTime) 
                          ? `${Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))} min (est.)`
                          : "N/A"}
                    </TableCell>
                    <TableCell>
                      ${((session.billedAmount || 0) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.status === "completed" ? "success" :
                          session.status === "cancelled" ? "destructive" :
                          session.status === "in_progress" ? "warning" :
                          "default"
                        }
                      >
                        {session.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.status === "completed" ? (
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon 
                              key={i}
                              className={`h-4 w-4 ${i < (session.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * itemsPerPage + 1}-
            {Math.min(page * itemsPerPage, filteredSessions.length)} of{" "}
            {filteredSessions.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Button
                  key={i}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}