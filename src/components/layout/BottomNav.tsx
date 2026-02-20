'use client';

import { BookOpen, House, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

function getNavColor(isActive: boolean) {
  return isActive ? '#111' : '#888';
}

function resolveActive(pathname: string): 'home' | 'review' | 'settings' {
  if (pathname.startsWith('/review')) return 'review';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const active = resolveActive(pathname);

  return (
    <nav
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        width: '100%',
        maxWidth: '480px',
        height: '64px',
        borderTop: '1px solid #e9e9e9',
        background: '#fff',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        alignItems: 'center',
        padding: '0 12px',
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        style={{
          border: 'none',
          background: 'transparent',
          color: getNavColor(active === 'home'),
          fontWeight: active === 'home' ? 700 : 400,
          cursor: 'pointer',
          display: 'grid',
          justifyItems: 'center',
          gap: '4px',
        }}
      >
        <House size={18} strokeWidth={2} />
        <span style={{ fontSize: '12px' }}>Home</span>
      </button>
      <button
        type="button"
        onClick={() => router.push('/review')}
        style={{
          border: 'none',
          background: 'transparent',
          color: getNavColor(active === 'review'),
          fontWeight: active === 'review' ? 700 : 400,
          cursor: 'pointer',
          display: 'grid',
          justifyItems: 'center',
          gap: '4px',
        }}
      >
        <BookOpen size={18} strokeWidth={2} />
        <span style={{ fontSize: '12px' }}>Review</span>
      </button>
      <button
        type="button"
        onClick={() => router.push('/settings')}
        style={{
          border: 'none',
          background: 'transparent',
          color: getNavColor(active === 'settings'),
          fontWeight: active === 'settings' ? 700 : 400,
          cursor: 'pointer',
          display: 'grid',
          justifyItems: 'center',
          gap: '4px',
        }}
      >
        <Settings size={18} strokeWidth={2} />
        <span style={{ fontSize: '12px' }}>Settings</span>
      </button>
    </nav>
  );
}
