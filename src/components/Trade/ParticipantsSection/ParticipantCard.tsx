import { Account } from '@/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ParticipantCardProps {
  user: Account | null;
  isCurrentUser?: boolean;
}

function ParticipantCard({ user, isCurrentUser = false }: ParticipantCardProps) {
  if (!user) return <div className="text-xs text-[#6b7280] font-mono">—</div>;

  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <Avatar className="w-10 h-10 rounded-sm">
        <AvatarImage src={user.profile_photo_url} alt={user.username || 'User'} />
        <AvatarFallback className="bg-[#f97316]/20 text-[#f97316] rounded-sm">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-medium text-[#ffffff] truncate">
          {user.username || 'Anonymous'}
        </p>
        <p className="text-[10px] font-mono text-[#6b7280] truncate">
          #{user.id}
        </p>
      </div>
      {isCurrentUser && (
        <span className="text-[10px] font-mono font-bold text-[#f97316] tracking-wider">
          (YOU)
        </span>
      )}
    </div>
  );
}

export default ParticipantCard;
