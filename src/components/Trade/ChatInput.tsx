import { useState, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onAttach?: (file: File) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onAttach, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setMessage('');
    try {
      await onSend(trimmed);
    } catch { /* optimistic — message already shown */ }
    setSending(false);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAttach) return;
    setUploading(true);
    try {
      await onAttach(file);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#1f1f1f] px-4 py-3 flex items-end gap-2 bg-[#111111]">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
        onChange={handleAttach}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading || disabled || !onAttach}
        title={onAttach ? 'Attach file (max 5MB)' : 'Upload coming soon'}
        className="text-muted hover:text-white disabled:opacity-30 p-1.5 rounded-sm hover:bg-[#1f1f1f] transition shrink-0"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </button>

      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message..."
          className="w-full bg-[#1a1a1a] border border-[#2b3139] rounded-sm px-3 py-2 text-sm font-mono text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[#f97316]/50 transition"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!message.trim() || sending || disabled}
        className="bg-[#f97316] hover:opacity-90 disabled:opacity-30 text-white rounded-sm px-3 py-2 shrink-0 transition"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
