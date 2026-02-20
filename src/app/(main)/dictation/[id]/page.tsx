import DictationEditor from '@/components/dictation/DictationEditor';

export default async function DictationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DictationEditor sessionId={id} />;
}
