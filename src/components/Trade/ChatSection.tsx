import { Button } from '@/components/ui/button';
import { Account } from '@/api';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface ChatSectionProps {
  counterparty: Account | null;
  className?: string;
}

function ChatSection({ counterparty, className }: ChatSectionProps) {
  return (
    <div className={`bg-[#111111] border border-[#1f1f1f] rounded-sm flex flex-col ${className || ''}`}>
      <div className="border-b border-[#1f1f1f] px-4 py-3">
        <h3 className="text-sm font-mono font-bold text-[#ffffff] tracking-wider uppercase">
          Trade Chat
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-2 border-[#1f1f1f] rounded-sm flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#6b7280]" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-mono font-bold text-[#ffffff] mb-1">
              No messages yet
            </h4>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Communicate with your counterparty to coordinate payment and release.
            </p>
          </div>
          {counterparty?.telegram_username ? (
            <Button
              onClick={() =>
                window.open(`https://t.me/${counterparty.telegram_username}`, '_blank')
              }
              className="bg-[#f97316] hover:opacity-90 text-[#ffffff] font-mono font-bold rounded-sm h-9 px-5 text-xs tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Contact on Telegram
            </Button>
          ) : (
            <p className="text-[10px] font-mono text-[#6b7280] tracking-wider uppercase">
              No contact shared
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatSection;
