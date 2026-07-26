import { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usePaymentMethods, UserPaymentMethod } from '@/hooks/usePaymentMethods';
import { PAYMENT_METHODS, getPaymentMethodById } from '@/lib/paymentMethods';

interface PaymentMethodsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (methods: string[]) => void;
  selected?: string[];
}

export function PaymentMethodsModal({ open, onClose, onSelect, selected = [] }: PaymentMethodsModalProps) {
  const { methods, loading, add, remove } = usePaymentMethods();
  const [adding, setAdding] = useState(false);
  const [methodType, setMethodType] = useState(PAYMENT_METHODS[0]?.id || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const pmInfo = getPaymentMethodById(methodType);

  const handleAdd = async () => {
    if (!accountNumber.trim()) return;
    setSaving(true);
    try {
      await add({ method_type: methodType, account_number: accountNumber, account_name: accountName || undefined });
      setAccountNumber('');
      setAccountName('');
      setAdding(false);
      toast.success('Payment method saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try { await remove(id); } catch { toast.error('Failed to remove'); }
  };

  const handleToggle = (m: UserPaymentMethod) => {
    if (!onSelect) return;
    const key = m.method_type;
    if (selected.includes(key)) {
      onSelect(selected.filter(k => k !== key));
    } else {
      onSelect([...selected, key]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-[#111111] border border-[#1f1f1f] rounded-sm w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
          <h3 className="text-sm font-mono font-bold text-white">Payment Methods</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        {/* Saved methods */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-muted animate-spin" /></div>
          ) : methods.length === 0 ? (
            <p className="text-[11px] font-mono text-muted text-center py-4">No saved payment methods yet. Add one below.</p>
          ) : (
            <div className="space-y-1.5">
              {methods.map(m => {
                const info = getPaymentMethodById(m.method_type);
                const checked = selected.includes(m.method_type);
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition ${
                    checked ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10' : 'border-[#1f1f1f]'
                  }`}>
                    {onSelect ? (
                      <button type="button" onClick={() => handleToggle(m)} className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-[#2b3139]'
                      }`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold text-white">{info?.name || m.method_type}</p>
                      <p className="text-[10px] font-mono text-muted truncate">
                        {m.account_number}{m.account_name ? ` / ${m.account_name}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleDelete(m.id)} className="text-muted hover:text-red-400 p-1 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new */}
          {adding ? (
            <div className="space-y-3 border-t border-[#1f1f1f] pt-3">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Method</label>
                <select value={methodType} onChange={e => setMethodType(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-sm px-3 py-2 text-xs font-mono text-white">
                  {PAYMENT_METHODS.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">{pmInfo?.accountLabel}</label>
                <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                  className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-9 text-xs font-mono"
                  placeholder="e.g. 2519XXXXXXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Account Name (optional)</label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)}
                  className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-9 text-xs font-mono" />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setAdding(false)} variant="ghost" className="flex-1 font-mono text-xs rounded-sm">Cancel</Button>
                <Button type="button" onClick={handleAdd} disabled={saving || !accountNumber.trim()}
                  className="flex-1 bg-[#f97316] hover:opacity-90 text-white font-mono text-xs rounded-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Method'}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={() => setAdding(true)} variant="ghost"
              className="w-full border border-dashed border-[#2b3139] text-muted hover:text-white font-mono text-xs rounded-sm py-3">
              <Plus className="w-3.5 h-3.5 mr-2" />
              Add Payment Method
            </Button>
          )}
        </div>

        {/* Footer */}
        {onSelect && (
          <div className="border-t border-[#1f1f1f] p-4">
            <Button type="button" onClick={onClose}
              className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold text-xs rounded-sm">
              Done ({selected.length} selected)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
