import ResultKeywordEditor from '@/components/result/ResultKeywordEditor';
import BottomNav from '@/components/layout/BottomNav';

export default async function DictationResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      style={{ minHeight: '100dvh', padding: '20px', paddingBottom: '92px' }}
    >
      <ResultKeywordEditor sessionId={id} />
      <BottomNav active="home" />
    </main>
  );
}
