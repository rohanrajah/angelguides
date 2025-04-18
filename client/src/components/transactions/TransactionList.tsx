import { TransactionItem } from './TransactionItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';

interface TransactionListProps {
  userId: number;
  title?: string;
  description?: string;
  limit?: number;
  showAll?: boolean;
  isAdvisor?: boolean;
}

export function TransactionList({ 
  userId, 
  title = "Transaction History", 
  description,
  limit = 5,
  showAll = false,
  isAdvisor = false
}: TransactionListProps) {
  // Use different endpoint based on user type
  const endpoint = isAdvisor 
    ? `/api/advisors/${userId}/earnings` 
    : `/api/users/${userId}/transactions`;
  
  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 border-b animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-[250px]"></div>
                  <div className="h-3 bg-muted rounded w-[120px]"></div>
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="h-4 bg-muted rounded w-[60px]"></div>
                  <div className="h-6 bg-muted rounded w-[70px]"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading transactions</p>
        </CardContent>
      </Card>
    );
  }

  // For advisors, the transactions are inside the response
  const transactions = isAdvisor ? data?.transactions : data;
  
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  // Limit the number of transactions to display unless showAll is true
  const displayedTransactions = showAll 
    ? transactions 
    : transactions.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {displayedTransactions.map((transaction: any) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}