import { useCallback, useEffect, useState } from 'react';
import { api as defaultApi, Api } from './api/client';
import { Sample, SampleStatus } from './types';
import { SampleForm } from './components/SampleForm';
import { SampleTable } from './components/SampleTable';

export function App({ api = defaultApi }: { api?: Api }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await api.list(filter || undefined);
      setSamples(page.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, filter]);

  useEffect(() => { void load(); }, [load]);

  const create = async (input: { code: string; studyId: string; type: string }) => {
    await api.create(input);
    await load();
  };

  const advance = async (id: string, to: SampleStatus) => {
    try {
      await api.advance(id, to);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1>LabTrack</h1>
        <p>Track study samples from receipt to completed analysis.</p>
      </header>
      <section aria-labelledby="register-heading" className="card">
        <h2 id="register-heading">Register a sample</h2>
        <SampleForm onSubmit={create} />
      </section>
      <section aria-labelledby="samples-heading" className="card">
        <div className="card__head">
          <h2 id="samples-heading">Samples</h2>
          <label className="filter">
            Filter by study
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="All studies" />
          </label>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <SampleTable samples={samples} onAdvance={advance} />
      </section>
    </main>
  );
}
