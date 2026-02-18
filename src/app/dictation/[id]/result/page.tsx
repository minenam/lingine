import ResultKeywordEditor from '@/components/result/ResultKeywordEditor';

export default async function DictationResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ minHeight: '100dvh', padding: '20px' }}>
      <ResultKeywordEditor sessionId={id} />
    </main>
  );
}
