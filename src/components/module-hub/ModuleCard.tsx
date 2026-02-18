type ModuleCardProps =
  | {
      variant: 'listening';
      statusLabel: string;
      statusTextColor: string;
      dotColor: string;
      onClick: () => void;
      disabled?: false;
    }
  | {
      variant: 'locked';
      name: string;
      disabled: true;
    };

export default function ModuleCard(props: ModuleCardProps) {
  if (props.variant === 'listening') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-label="Go to listening module"
        style={{
          borderRadius: '18px',
          border: '1px solid #e6e6e6',
          background: '#fff',
          boxShadow: '0 8px 18px rgba(17, 24, 39, 0.05)',
          padding: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '999px',
              background: '#e8f7ec',
              color: '#2f7a3f',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
            }}
          >
            L
          </span>
          <div style={{ display: 'grid', gap: '4px', textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>
              Listening
            </p>
            <p
              style={{
                margin: 0,
                color: props.statusTextColor,
                fontWeight: 600,
              }}
            >
              {props.statusLabel}
            </p>
          </div>
        </div>
        <span
          aria-hidden
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '999px',
            background: props.dotColor,
            flexShrink: 0,
          }}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={props.disabled}
      aria-disabled={props.disabled}
      style={{
        borderRadius: '18px',
        border: '1px solid #ececec',
        background: '#f2f2f2',
        padding: '18px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        color: '#999',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '999px',
            border: '1px solid #d9d9d9',
            color: '#999',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
          }}
        >
          {props.name.charAt(0)}
        </span>
        <div style={{ display: 'grid', gap: '4px', textAlign: 'left' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{props.name}</p>
          <p style={{ margin: 0, fontSize: '13px' }}>Locked</p>
        </div>
      </div>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>LOCK</span>
    </button>
  );
}
