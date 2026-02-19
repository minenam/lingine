import DictationEditor from '@/components/dictation/DictationEditor';
import BottomNav from '@/components/layout/BottomNav';

export default async function DictationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      style={{ minHeight: '100dvh', padding: '20px', paddingBottom: '92px' }}
    >
      <DictationEditor sessionId={id} />
      <BottomNav active="home" />
    </main>
  );
}
