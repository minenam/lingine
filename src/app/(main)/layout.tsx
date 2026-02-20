import BottomNav from '@/components/layout/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '24px',
        paddingBottom: '92px',
      }}
    >
      {children}
      <BottomNav />
    </main>
  );
}
