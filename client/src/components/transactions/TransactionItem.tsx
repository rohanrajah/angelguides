import { formatDistanceToNow } from 'date-fns';
import { TransactionType } from '@shared/schema';
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

interface TransactionItemProps {
  transaction: {
    id: number;
    type: TransactionType;
    amount: number;
    description: string;
    timestamp: string | Date;
    paymentStatus: string;
  };
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const date = new Date(transaction.timestamp);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  
  // Determine badge color based on transaction type
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  if (transaction.type === TransactionType.USER_TOPUP) {
    badgeVariant = "default"; // Primary color for top-ups (credits)
  } else if (transaction.type === TransactionType.SESSION_PAYMENT) {
    badgeVariant = "secondary"; // Secondary color for session payments
  } else if (transaction.type === TransactionType.ADVISOR_PAYOUT) {
    badgeVariant = transaction.paymentStatus === 'completed' 
      ? "destructive"  // Red for completed payouts (money leaving the system)
      : "outline";     // Outline for pending payouts
  }
  
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0">
      <div className="flex flex-col">
        <div className="font-medium">{transaction.description}</div>
        <div className="text-sm text-muted-foreground">{relativeTime}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${transaction.type === TransactionType.USER_TOPUP ? 'text-green-600' : ''}`}>
          {transaction.type === TransactionType.USER_TOPUP 
            ? '+' 
            : transaction.type === TransactionType.ADVISOR_PAYOUT && transaction.paymentStatus === 'completed'
              ? '-'
              : ''}
          {formatCurrency(transaction.amount)}
        </span>
        <Badge variant={badgeVariant}>
          {transaction.type === TransactionType.USER_TOPUP 
            ? 'Top-up' 
            : transaction.type === TransactionType.SESSION_PAYMENT 
              ? 'Session'
              : transaction.paymentStatus === 'pending'
                ? 'Pending Payout'
                : 'Payout'}
        </Badge>
      </div>
    </div>
  );
}