'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isDisabled = password.trim().length === 0 || isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim().length === 0) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as LoginErrorResponse;
        setErrorMessage(errorData.error?.message ?? 'Login failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '24px' }}>Lingine</h1>
      <p style={{ margin: 0, color: '#666' }}>
        Daily Modular Learning Workspace
      </p>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        style={{
          height: '52px',
          borderRadius: '20px',
          border: '1px solid #e5e5e5',
          padding: '0 16px',
          fontSize: '16px',
        }}
      />

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          height: '52px',
          border: 'none',
          borderRadius: '20px',
          background: isDisabled ? '#eaeaea' : '#1a1a2e',
          color: isDisabled ? '#999' : '#fff',
          fontSize: '16px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      {errorMessage ? (
        <p style={{ margin: 0, color: '#d11a2a', fontSize: '14px' }}>
          {errorMessage}
        </p>
      ) : null}

      <p style={{ marginTop: '12px', color: '#888', fontSize: '14px' }}>
        App to Home Screen
      </p>
    </form>
  );
}
