import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Account } from '@/api';
import { Send } from 'lucide-react';

interface ChatSectionProps {
  counterparty: Account | null;
}

function ChatSection({ counterparty }: ChatSectionProps) {
  return (
    <Card className="bg-[#1e2329] border-[#2b3139] p-4 rounded-sm">
      <CardHeader className="border-b border-[#2b3139] pb-4 px-0 mx-4">
        <CardTitle className="text-[#eaecef] font-bold">Trade Chat</CardTitle>
        <CardDescription className="text-[#848e9c] text-xs">Direct communication with your counterparty</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="text-center py-12 space-y-4">
          <p className="text-[#848e9c] text-sm">Internal chat system is coming soon.</p>
          {counterparty?.telegram_username ? (
            <Button
              onClick={() =>
                window.open(`https://t.me/${counterparty.telegram_username}`, '_blank')
              }
              className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm h-10 px-8"
            >
              <Send size={16} className="mr-2" />
              Message on Telegram
            </Button>
          ) : (
            <p className="text-[10px] text-[#5e6673] uppercase font-bold tracking-tighter">
              Advertiser has not provided Telegram contact
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatSection;
