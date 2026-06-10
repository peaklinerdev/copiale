import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="status"
    >
      {icon && (
        <div className="mb-4 text-[#848e9c]/50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#eaecef] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#848e9c] max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
