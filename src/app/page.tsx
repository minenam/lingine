export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          border: '1px solid #efefef',
          padding: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Lingine</h1>
        <p style={{ margin: '10px 0 0', color: '#666' }}>
          FR-00 initiation is ready. Continue with FR-01 auth implementation.
        </p>
      </section>
    </main>
  );
}
