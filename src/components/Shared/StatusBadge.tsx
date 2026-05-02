import React from 'react';
import { Badge } from '@/components/ui/badge';
import { badgeVariants } from '@/components/ui/badgeVariants';
import { VariantProps } from 'class-variance-authority';

interface StatusBadgeProps
  extends Omit<React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>, 'variant'> {
  children?: React.ReactNode;
  className?: string;
  showOnMobile?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  children = 'Live Market',
  className = '',
  showOnMobile = false,
  ...props
}) => {
  return (
    <Badge
      variant="secondary"
      className={`bg-[#fcd535]/10 text-[#fcd535] border-[#fcd535]/20 text-[9px] uppercase font-black tracking-widest ${
        showOnMobile ? '' : 'hidden sm:inline-flex'
      } ${className}`}
      {...props}
    >
      {children}
    </Badge>
  );
};

export default StatusBadge;
