import { Check, CheckCheck, Paperclip } from 'lucide-react';

interface MessageBubbleProps {
  message: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  timestamp: string;
  isOwn: boolean;
  seen: boolean;
  username: string;
}

export function MessageBubble({
  message, attachmentUrl, attachmentType, attachmentName, timestamp, isOwn, seen, username,
}: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-3 px-4`}>
      {!isOwn && (
        <span className="text-[9px] font-mono text-muted mb-0.5 ml-1">@{username}</span>
      )}

      {/* Attachment */}
      {attachmentUrl && attachmentType === 'image' && (
        <div className={`max-w-[240px] mb-1 rounded-sm overflow-hidden border border-[#1f1f1f] ${isOwn ? 'ml-auto' : ''}`}>
          <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
            <img src={attachmentUrl} alt={attachmentName || 'attachment'} className="w-full h-auto max-h-[200px] object-cover" loading="lazy" />
          </a>
          {attachmentName && (
            <p className="text-[9px] font-mono text-muted px-2 py-1 truncate">{attachmentName}</p>
          )}
        </div>
      )}

      {attachmentUrl && attachmentType !== 'image' && (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 mb-1 px-3 py-2 rounded-sm border border-[#1f1f1f] hover:bg-[#1f1f1f]/50 transition ${isOwn ? 'text-white' : 'text-white'}`}
        >
          <Paperclip className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-[11px] font-mono truncate max-w-[160px]">
            {attachmentName || 'Attachment'}
          </span>
        </a>
      )}

      {/* Message text */}
      {message && (
        <div
          className={`max-w-[320px] px-3 py-2 rounded-sm text-sm font-mono leading-relaxed break-words
            ${isOwn
              ? 'bg-[#f97316]/15 text-white border border-[#f97316]/20'
              : 'bg-[#1f1f1f] text-white border border-[#2b3139]'
            }`}
        >
          {message}
        </div>
      )}

      {/* Timestamp + seen */}
      <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <span className="text-[9px] font-mono text-muted">{time}</span>
        {isOwn && (
          seen
            ? <CheckCheck className="w-3 h-3 text-green-500" />
            : <Check className="w-3 h-3 text-muted" />
        )}
      </div>
    </div>
  );
}
