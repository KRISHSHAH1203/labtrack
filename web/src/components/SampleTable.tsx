import { NEXT_STATUS, Sample, SampleStatus } from '../types';

interface Props {
  samples: Sample[];
  onAdvance: (id: string, to: SampleStatus) => void;
}

const LABEL: Record<SampleStatus, string> = {
  RECEIVED: 'Received', IN_ANALYSIS: 'In analysis', COMPLETED: 'Completed', REJECTED: 'Rejected',
};

/** Reusable presentational component: no data fetching inside. */
export function SampleTable({ samples, onAdvance }: Props) {
  if (samples.length === 0) return <p className="empty">No samples yet.</p>;
  return (
    <table className="sample-table">
      <thead>
        <tr><th scope="col">Code</th><th scope="col">Study</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr>
      </thead>
      <tbody>
        {samples.map((s) => {
          const next = NEXT_STATUS[s.status];
          return (
            <tr key={s.id}>
              <td>{s.code}</td>
              <td>{s.studyId}</td>
              <td>{s.type}</td>
              <td><span className={`badge badge--${s.status.toLowerCase()}`}>{LABEL[s.status]}</span></td>
              <td>
                {next && (
                  <button type="button" onClick={() => onAdvance(s.id, next)} aria-label={`Move ${s.code} to ${LABEL[next]}`}>
                    Move to {LABEL[next]}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
