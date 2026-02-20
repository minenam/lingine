'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SettingsClientProps = {
  userId: string;
  initialDescription: string | null;
  version: string;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export default function SettingsClient({
  userId,
  initialDescription,
  version,
}: SettingsClientProps) {
  const router = useRouter();

  const [description, setDescription] = useState(initialDescription ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');

  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const installGuide = useMemo(
    () => [
      'iOS Safari: Share > Add to Home Screen',
      'Android Chrome: Menu > Add to Home screen',
    ],
    [],
  );

  const handleSaveDescription = async () => {
    setAccountMessage('');
    setAccountError('');
    setIsSavingDescription(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(
          errorData.error?.message ?? 'Failed to update description',
        );
      }

      setAccountMessage('Description updated');
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : 'Failed to update description',
      );
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleChangePassword = async () => {
    setAccountMessage('');
    setAccountError('');

    if (newPassword !== confirmPassword) {
      setAccountError('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(
          errorData.error?.message ?? 'Failed to change password',
        );
      }

      await fetch('/api/users/logout', { method: 'POST' });
      router.push('/login?passwordChanged=1');
      router.refresh();
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : 'Failed to change password',
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBackup = async () => {
    setBackupMessage('');
    setBackupError('');
    setIsBackingUp(true);

    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error?.message ?? 'Failed to export backup');
      }

      const disposition = response.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] ?? 'lingine-backup.json';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setBackupMessage('Backup exported successfully');
    } catch (error) {
      setBackupError(
        error instanceof Error ? error.message : 'Failed to export backup',
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('정말 로그아웃하시겠습니까?')) return;

    setIsLoggingOut(true);

    try {
      await fetch('/api/users/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <section style={{ width: '100%' }}>
      <header style={{ display: 'grid', gap: '6px' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            textAlign: 'left',
            fontSize: '24px',
            fontWeight: 700,
            color: '#111',
            cursor: 'pointer',
          }}
          aria-label="Back to dashboard"
        >
          {'< Settings'}
        </button>
      </header>

      <section
        style={{
          marginTop: '16px',
          border: '1px solid #ececec',
          borderRadius: '14px',
          padding: '14px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px' }}>Account</h2>

        <label
          style={{
            display: 'grid',
            gap: '6px',
            fontSize: '14px',
            color: '#444',
          }}
        >
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Write a memo"
            maxLength={255}
            style={{
              height: '44px',
              borderRadius: '10px',
              border: '1px solid #ddd',
              padding: '0 12px',
              fontSize: '14px',
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleSaveDescription}
          disabled={isSavingDescription}
          style={{
            border: 'none',
            borderRadius: '10px',
            height: '40px',
            background: isSavingDescription ? '#eaeaea' : '#1a1a2e',
            color: isSavingDescription ? '#888' : '#fff',
            cursor: isSavingDescription ? 'not-allowed' : 'pointer',
          }}
        >
          {isSavingDescription ? 'Saving...' : 'Save Description'}
        </button>

        <hr
          style={{ border: 0, borderTop: '1px solid #efefef', width: '100%' }}
        />

        <h3 style={{ margin: 0, fontSize: '14px' }}>Change Password</h3>

        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Current Password"
          style={{
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New Password"
          style={{
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm New Password"
          style={{
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={isChangingPassword}
          style={{
            border: 'none',
            borderRadius: '10px',
            height: '40px',
            background: isChangingPassword ? '#eaeaea' : '#1a1a2e',
            color: isChangingPassword ? '#888' : '#fff',
            cursor: isChangingPassword ? 'not-allowed' : 'pointer',
          }}
        >
          {isChangingPassword ? 'Updating...' : 'Change Password'}
        </button>

        {accountMessage ? (
          <p style={{ margin: 0, color: '#19703d', fontSize: '14px' }}>
            {accountMessage}
          </p>
        ) : null}
        {accountError ? (
          <p style={{ margin: 0, color: '#cf2e2e', fontSize: '14px' }}>
            {accountError}
          </p>
        ) : null}
      </section>

      <section
        style={{
          marginTop: '12px',
          border: '1px solid #ececec',
          borderRadius: '14px',
          padding: '14px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px' }}>Data</h2>
        <button
          type="button"
          onClick={handleBackup}
          disabled={isBackingUp}
          style={{
            border: 'none',
            borderRadius: '10px',
            height: '40px',
            background: isBackingUp ? '#eaeaea' : '#1a1a2e',
            color: isBackingUp ? '#888' : '#fff',
            cursor: isBackingUp ? 'not-allowed' : 'pointer',
          }}
        >
          {isBackingUp ? 'Exporting...' : 'Export Data'}
        </button>
        {backupMessage ? (
          <p style={{ margin: 0, color: '#19703d', fontSize: '14px' }}>
            {backupMessage}
          </p>
        ) : null}
        {backupError ? (
          <p style={{ margin: 0, color: '#cf2e2e', fontSize: '14px' }}>
            {backupError}
          </p>
        ) : null}
      </section>

      <section
        style={{
          marginTop: '12px',
          border: '1px solid #ececec',
          borderRadius: '14px',
          padding: '14px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px' }}>App Info</h2>
        <div
          style={{
            display: 'grid',
            gap: '6px',
            color: '#444',
            fontSize: '14px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>PWA Install Guide</p>
          {installGuide.map((line) => (
            <p key={line} style={{ margin: 0 }}>
              - {line}
            </p>
          ))}
          <p style={{ margin: '8px 0 0', color: '#111' }}>Version v{version}</p>
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{
          marginTop: '12px',
          width: '100%',
          border: '1px solid #cf2e2e',
          borderRadius: '10px',
          height: '40px',
          background: 'transparent',
          color: isLoggingOut ? '#888' : '#cf2e2e',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </section>
  );
}
