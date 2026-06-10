import { useState, useEffect, useRef } from 'react';

interface TradeTimerProps {
  deadline: string | null;
  onExpire?: () => void;
  label: string;
}

function TradeTimer({ deadline, onExpire, label }: TradeTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    progress: 100,
  });

  const expiredNotifiedRef = useRef(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    expiredNotifiedRef.current = false;
    startRef.current = null;

    if (!deadline) {
      setTimeRemaining(s => ({ ...s, hours: 0, minutes: 0, seconds: 0, expired: true, progress: 0 }));
      return;
    }

    const calculate = () => {
      const now = Date.now();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (startRef.current === null) {
        startRef.current = now;
      }

      const totalDuration = deadlineTime - startRef.current;
      const elapsed = now - startRef.current;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true, progress: 0 });
        if (onExpire && !expiredNotifiedRef.current) {
          expiredNotifiedRef.current = true;
          setTimeout(() => onExpire(), 1000);
        }
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const remaining = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;

      setTimeRemaining({ hours, minutes, seconds, expired: false, progress: Math.min(100, remaining) });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const fmt = (v: number) => (v < 10 ? `0${v}` : `${v}`);

  if (timeRemaining.expired) {
    return (
      <div className="space-y-2">
        <div className="text-[10px] font-mono font-bold tracking-wider text-[#6b7280] uppercase">{label}</div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-black text-[#ef4444]">00:00:00</span>
          <span className="text-[10px] font-mono font-bold text-[#ef4444] tracking-wider uppercase">
            Expired
          </span>
        </div>
        <div className="h-1 bg-[#1f1f1f] rounded-none overflow-hidden">
          <div className="h-full w-full bg-[#ef4444]/30" />
        </div>
      </div>
    );
  }

  const isUrgent = timeRemaining.hours === 0 && timeRemaining.minutes < 10;
  const timerColor = isUrgent ? '#ef4444' : '#f97316';

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono font-bold tracking-wider text-[#6b7280] uppercase">{label}</div>
      <div className="font-mono text-3xl font-black tracking-wider" style={{ color: timerColor }}>
        {fmt(timeRemaining.hours)}:{fmt(timeRemaining.minutes)}:{fmt(timeRemaining.seconds)}
      </div>
      <div className="h-1.5 bg-[#1f1f1f] rounded-none overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-linear rounded-none"
          style={{
            width: `${100 - timeRemaining.progress}%`,
            backgroundColor: isUrgent ? '#ef4444' : '#f97316',
          }}
        />
      </div>
    </div>
  );
}

export default TradeTimer;
