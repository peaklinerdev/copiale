import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/api';

interface ChatMessage {
  id: string;
  trade_id: number;
  sender_account_id: number;
  message: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
  seen_at: string | null;
  sender_username: string;
  sender_avatar: string | null;
}

export function useTradeChat(tradeId: number | undefined, accountId: number | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tradeId || !accountId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/trades/${tradeId}/messages`);
        setMessages(res.data.messages);
        setLoading(false);
        setError(null);
      } catch (e: any) {
        if (e?.status !== 403) setError('Failed to load messages');
        setLoading(false);
      }
    };

    fetchMessages();

    // Poll every 5 seconds (simple realtime fallback — no Supabase SDK needed)
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tradeId, accountId]);

  useEffect(() => {
    // Mark messages as seen when viewing the chat
    if (!tradeId || !messages.length) return;
    const unseen = messages.filter(m => m.sender_account_id !== accountId && !m.seen_at);
    if (unseen.length > 0) {
      api.post(`/trades/${tradeId}/messages/seen`).catch(() => {});
    }
  }, [messages.length, tradeId, accountId]);

  const sendMessage = useCallback(async (message: string) => {
    if (!tradeId) return;
    const res = await api.post(`/trades/${tradeId}/messages`, { message });
    setMessages(prev => [...prev, { ...res.data, sender_username: 'You', sender_avatar: null }]);
  }, [tradeId]);

  const sendAttachment = useCallback(async (url: string, type: string, name: string) => {
    if (!tradeId) return;
    const res = await api.post(`/trades/${tradeId}/messages`, {
      attachment_url: url, attachment_type: type, attachment_name: name,
    });
    setMessages(prev => [...prev, { ...res.data, sender_username: 'You', sender_avatar: null }]);
  }, [tradeId]);

  return { messages, loading, error, sendMessage, sendAttachment, bottomRef };
}
