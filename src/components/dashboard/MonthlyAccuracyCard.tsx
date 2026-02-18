type MonthlyAccuracyCardProps = {
  monthlyAverageScore: number | null;
};

function getFeedbackLabel(score: number | null) {
  if (score === null) {
    return 'No Data';
  }

  if (score >= 90) {
    return 'Excellent';
  }

  if (score >= 70) {
    return 'Good';
  }

  if (score >= 50) {
    return 'Average';
  }

  return 'Needs Work';
}

function getProgressColor(score: number | null) {
  if (score === null) {
    return '#c8ccd4';
  }

  if (score >= 70) {
    return '#2ea043';
  }

  return '#cf2e2e';
}

export default function MonthlyAccuracyCard({
  monthlyAverageScore,
}: MonthlyAccuracyCardProps) {
  const monthlyLabel = getFeedbackLabel(monthlyAverageScore);
  const progressColor = getProgressColor(monthlyAverageScore);

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
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: '#888',
          }}
        >
          MONTHLY ACCURACY
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '34px', fontWeight: 700 }}>
          {monthlyAverageScore === null ? '-' : `${monthlyAverageScore}%`}
        </p>
      </div>
      <div style={{ display: 'grid', justifyItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '66px',
            height: '66px',
            borderRadius: '999px',
            border: `6px solid ${progressColor}`,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 600,
            color: '#111',
            fontSize: '13px',
          }}
        >
          {monthlyAverageScore === null ? '--' : `${monthlyAverageScore}%`}
        </div>
        <span style={{ color: '#666', fontSize: '13px' }}>{monthlyLabel}</span>
      </div>
    </article>
  );
}
