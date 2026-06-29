import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useResponsiveAudit } from '@/hooks/useResponsiveAudit';
import { LayoutGrid, Loader2, Smartphone, Monitor } from 'lucide-react';

interface AuditActionsProps {
  leadId?: string;
  selectedLeadIds?: string[];
}

export function AuditActions({ leadId, selectedLeadIds }: AuditActionsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [auditType, setAuditType] = useState<'single' | 'multiple' | 'pending'>('single');
  const { auditLead, auditMultiple, auditPending, isAuditing } = useResponsiveAudit();

  const handleAuditClick = (type: 'single' | 'multiple' | 'pending') => {
    setAuditType(type);
    setShowDialog(true);
  };

  const handleConfirm = () => {
    if (auditType === 'single' && leadId) {
      auditLead({ leadId });
    } else if (auditType === 'multiple' && selectedLeadIds && selectedLeadIds.length > 0) {
      auditMultiple({ leadIds: selectedLeadIds });
    } else if (auditType === 'pending') {
      auditPending({ limit: 50 });
    }
    setShowDialog(false);
  };

  if (leadId) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAuditClick('single')}
          disabled={isAuditing}
        >
          {isAuditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
          <span className="ml-2">Audit UI/UX</span>
        </Button>

        <ConfirmDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onConfirm={handleConfirm}
          type={auditType}
          count={1}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isAuditing}>
            {isAuditing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
            <span className="ml-2">Responsive Audit</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Audit Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {selectedLeadIds && selectedLeadIds.length > 0 && (
            <DropdownMenuItem onClick={() => handleAuditClick('multiple')}>
              <Monitor className="w-4 h-4 mr-2" />
              Audit Selected ({selectedLeadIds.length})
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleAuditClick('pending')}>
            <Smartphone className="w-4 h-4 mr-2" />
            Audit Pending (50)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirm}
        type={auditType}
        count={
          auditType === 'multiple' 
            ? selectedLeadIds?.length || 0 
            : auditType === 'pending' 
            ? 50 
            : 1
        }
      />
    </>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  count,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: 'single' | 'multiple' | 'pending';
  count: number;
}) {
  const getTitle = () => {
    if (type === 'single') return 'Audit Lead Website';
    if (type === 'multiple') return `Audit ${count} Leads`;
    return 'Audit Pending Leads';
  };

  const getDescription = () => {
    if (type === 'single') {
      return 'This will analyze the website for responsive design, UI/UX issues, and mobile experience. Screenshots will be captured for desktop and mobile views.';
    }
    if (type === 'multiple') {
      return `This will audit ${count} selected leads. The process may take several minutes depending on website complexity.`;
    }
    return `This will audit up to ${count} leads that haven't been audited yet. The process will run in the background.`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <span>Desktop viewport analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span>Mobile viewport analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <span>UI/UX issue detection</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Start Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
