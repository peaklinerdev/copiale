import { useEffect, useState } from 'react';
import { getAdminConfig, updateAdminConfig, type PlatformConfig } from '../../api/admin';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState('0.01');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getAdminConfig()
      .then((r) => {
        setConfig(r.data);
        setEnabled(r.data.gas_relay_enabled);
        setThreshold(String(r.data.gas_relay_threshold_sol));
      })
      .catch(() => setMsg('Failed to load config'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await updateAdminConfig({
        gas_relay_enabled: enabled,
        gas_relay_threshold_sol: Number(threshold),
      });
      setConfig(res.data);
      setMsg('Config updated');
    } catch {
      setMsg('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Platform Config</h1>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-[#1c2128] border border-[#2d333b] rounded text-sm text-[#e6edf3]">
          {msg}
        </div>
      )}

      <div className="max-w-lg bg-[#1c2128] border border-[#2d333b] rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#e6edf3] font-medium">Gas Relay</p>
            <p className="text-xs text-[#848e9c] mt-0.5">Allow platform to sponsor gas fees</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-[#444c56] rounded-full peer peer-checked:bg-[#539bf5] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        <div>
          <label className="block text-[#e6edf3] font-medium mb-1">Relay Threshold (SOL)</label>
          <p className="text-xs text-[#848e9c] mb-2">Auto-relay when user has less than this amount</p>
          <input
            type="number"
            step="0.001"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-3 py-2 bg-[#2d333b] border border-[#444c56] rounded text-[#e6edf3] focus:outline-none focus:border-[#539bf5]"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#539bf5] text-white rounded hover:bg-[#4184e4] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
