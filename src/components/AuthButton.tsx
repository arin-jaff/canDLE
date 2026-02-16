import { useEffect, useRef } from 'react';
import { useAuthStore } from '../hooks/useAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function AuthButton() {
  const { user, loading, login, logout } = useAuthStore();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user || loading) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const tryRender = () => {
      if (!window.google || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          await login(response.credential);
        },
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'icon',
        shape: 'square',
        size: 'small',
        theme: 'filled_black',
      });
    };

    // Google script might not be loaded yet
    if (window.google) {
      tryRender();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          tryRender();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [user, loading, login]);

  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center text-terminal-muted text-[10px]">
        ...
      </div>
    );
  }

  if (user) {
    return (
      <button
        onClick={logout}
        className="flex items-center gap-1.5 h-8 px-2 text-terminal-muted hover:text-terminal-green
          border border-terminal-border hover:border-terminal-green-dim/40 transition-colors rounded-sm"
        title={`${user.name} — Click to sign out`}
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-[10px]">{user.name[0]}</span>
        )}
        <span className="text-[9px] tracking-wider uppercase hidden sm:inline">
          {user.name.split(' ')[0]}
        </span>
      </button>
    );
  }

  // Show Google Sign-In button
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div ref={btnRef} className="h-8 flex items-center" />
  );
}
