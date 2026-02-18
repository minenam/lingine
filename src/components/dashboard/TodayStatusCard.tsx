import { ArrowRight } from 'lucide-react';

type TodayStatusCardProps = {
  isTodayDone: boolean;
  onStartLearning: () => void;
};

export default function TodayStatusCard({
  isTodayDone,
  onStartLearning,
}: TodayStatusCardProps) {
  const statusLabel = isTodayDone ? 'DONE' : 'TO DO';

  return (
    <article
      style={{
        borderRadius: '16px',
        background: '#fff',
        border: '1px solid #ededed',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div>
        <span
          style={{
            display: 'inline-flex',
            borderRadius: '999px',
            background: isTodayDone ? '#f2f2f2' : '#e6f6ea',
            color: isTodayDone ? '#666' : '#2f7a3f',
            fontSize: '11px',
            fontWeight: 600,
            padding: '5px 10px',
          }}
        >
          {statusLabel}
        </span>
        <p style={{ margin: '10px 0 4px', fontSize: '19px', fontWeight: 700 }}>
          {isTodayDone ? 'Today Completed' : 'Start Learning'}
        </p>
        <p style={{ margin: 0, color: '#666' }}>
          {isTodayDone
            ? 'Nice work. Keep your streak alive.'
            : 'Keep your streak alive!'}
        </p>
      </div>
      <button
        type="button"
        onClick={onStartLearning}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '999px',
          border: 'none',
          background: '#111',
          color: '#fff',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
        aria-label="Start learning"
      >
        <ArrowRight size={18} strokeWidth={2.2} color="#fff" />
      </button>
    </article>
  );
}
