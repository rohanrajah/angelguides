import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, UserType } from '@shared/schema';
import { Dashboard } from '@/components/dashboard';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (error || !user) {
    return <Redirect to="/auth" />;
  }

  return <Dashboard user={user} />;
};

export default DashboardPage;