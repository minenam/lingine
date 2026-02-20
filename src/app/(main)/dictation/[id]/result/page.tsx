import ResultKeywordEditor from '@/components/result/ResultKeywordEditor';

export default async function DictationResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ResultKeywordEditor sessionId={id} />;
}
