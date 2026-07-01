import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAppStore } from '../../store';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Bug Report', 'Feature Request', 'Data Issue', 'General Feedback'];

export function SupportModal({ open, onClose }: SupportModalProps) {
  const session  = useAppStore(s => s.auth.session);
  const [message,  setMessage]  = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) {
      setError('Please enter at least 5 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: message.trim(), category }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send.');
      }
      setSuccess(true);
      setMessage('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[6px_6px_0px_0px_var(--color-ink)] p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-ink)] pb-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">SUPPORT_FEEDBACK</span>
          <button onClick={handleClose} className="hover:opacity-60 transition-opacity text-[var(--color-ink)]">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-[var(--color-ink)] mb-2 font-mono">MESSAGE_SENT ✓</p>
            <p className="text-[10px] text-[var(--color-ink-muted)] mb-4 font-mono">
              We have received your feedback. Thank you.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-primary)] text-xs font-bold border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:opacity-80 transition-opacity rounded-[var(--border-radius)] font-mono"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <>
            {/* Category Select */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--color-ink)]">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] text-xs font-bold uppercase outline-none text-[var(--color-ink)]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--color-ink)]">
                MESSAGE ({message.length}/2000)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Describe your issue or feedback..."
                className="w-full px-3 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] text-xs outline-none resize-none placeholder-[var(--color-ink-muted)] text-[var(--color-ink)]"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-[10px] text-[var(--color-danger)] font-bold mb-3 border-l-4 border-[var(--color-danger)] pl-2">
                ERROR: {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] text-xs font-bold uppercase rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_var(--color-ink)] transition-all duration-100 disabled:opacity-50 text-[var(--color-ink)]"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                className="flex-1 py-2.5 bg-[var(--color-ink)] text-[var(--color-primary)] border-2 border-[var(--color-ink)] text-xs font-bold uppercase rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_var(--color-ink)] transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'SENDING...' : <><Send size={12} /> SEND</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
