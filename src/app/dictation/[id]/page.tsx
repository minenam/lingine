import DictationEditor from '@/components/dictation/DictationEditor';

export default async function DictationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ minHeight: '100dvh', padding: '20px' }}>
      <DictationEditor sessionId={id} />
    </main>
  );
}
