import { FormEvent, useState } from 'react';

interface Props {
  onSubmit: (input: { code: string; studyId: string; type: string }) => Promise<void>;
}

/** Accessible form: every input has a label, errors are announced via role="alert". */
export function SampleForm({ onSubmit }: Props) {
  const [code, setCode] = useState('');
  const [studyId, setStudyId] = useState('');
  const [type, setType] = useState('Plasma');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit({ code: code.trim().toUpperCase(), studyId: studyId.trim(), type });
      setCode('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sample-form" onSubmit={handle} aria-label="Register sample">
      <label>
        Sample code
        <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="S-001" />
      </label>
      <label>
        Study ID
        <input value={studyId} onChange={(e) => setStudyId(e.target.value)} required placeholder="TOX-12" />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Plasma</option>
          <option>Serum</option>
          <option>Urine</option>
          <option>Tissue</option>
        </select>
      </label>
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Register'}</button>
      {error && <p role="alert" className="sample-form__error">{error}</p>}
    </form>
  );
}
