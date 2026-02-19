import ReviewSessions from '@/components/review/ReviewSessions';
import BottomNav from '@/components/layout/BottomNav';

export default function ReviewPage() {
  return (
    <main
      style={{ minHeight: '100dvh', padding: '20px', paddingBottom: '92px' }}
    >
      <ReviewSessions />
      <BottomNav active="review" />
    </main>
  );
}
