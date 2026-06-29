import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AuditStatusBadgeProps {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  label: string;
}

export function AuditStatusBadge({ status, label }: AuditStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Clock className="h-3 w-3" />
        {label}: —
      </Badge>
    );
  }

  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="text-[10px] gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3" />
          {label}: Done
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {label}: Running
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <XCircle className="h-3 w-3" />
          {label}: Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Clock className="h-3 w-3" />
          {label}: Pending
        </Badge>
      );
  }
}
