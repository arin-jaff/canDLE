import { useEffect, useState } from 'react';
import type { Stats } from '../lib/types';
import { useAuthStore } from '../hooks/useAuth';
import { fetchStats } from '../lib/api';

interface StatsModalProps {
  stats: Stats;
  onClose: () => void;
}

export function StatsModal({ stats: localStats, onClose }: StatsModalProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(localStats);
  const [source, setSource] = useState<'local' | 'cloud'>('local');

  // If logged in, fetch stats from backend
  useEffect(() => {
    if (!user) return;
    fetchStats().then((backendStats) => {
      if (backendStats && backendStats.gamesPlayed > 0) {
        setStats(backendStats);
        setSource('cloud');
      }
    });
  }, [user]);

  const avgScore = stats.gamesPlayed > 0
    ? Math.round(stats.totalScore / stats.gamesPlayed)
    : 0;

  const maxDist = Math.max(...stats.scoreDistribution, 1);

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-sm border border-terminal-border bg-terminal-black mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-terminal-border px-4 py-3 bg-terminal-dark">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-terminal-muted tracking-widest uppercase font-medium">STATISTICS</span>
            {user && (
              <span className="text-[8px] text-terminal-green tracking-wider uppercase">
                {source === 'cloud' ? 'SYNCED' : 'LOCAL'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-green text-sm"
          >
            [X]
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-px bg-terminal-border text-center">
            {[
              { value: stats.gamesPlayed, label: 'PLAYED' },
              { value: stats.gamesWon, label: 'WON' },
              { value: stats.currentStreak, label: 'STREAK' },
              { value: stats.maxStreak, label: 'MAX' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-terminal-panel p-3">
                <div className="text-xl font-mono font-bold text-terminal-green">{value}</div>
                <div className="text-[8px] text-terminal-muted tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-2">
              AVG SCORE: <span className="text-terminal-green font-mono">{avgScore}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-2">
              SCORE DISTRIBUTION
            </div>
            <div className="space-y-1">
              {stats.scoreDistribution.map((count, i) => {
                const label = i === 0 ? '0' : `${i * 100}`;
                const width = Math.max(8, (count / maxDist) * 100);
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-6 text-right text-terminal-muted">{label}</span>
                    <div
                      className="h-3 bg-terminal-green-dark flex items-center justify-end px-1"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-[8px] text-terminal-green">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center border-t border-terminal-border pt-3">
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-1">
              NEXT PUZZLE
            </div>
            <div className="text-lg font-mono text-terminal-green">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
            </div>
          </div>

          {!user && (
            <div className="text-center text-[9px] text-terminal-muted tracking-wider uppercase">
              SIGN IN TO SYNC STATS ACROSS DEVICES
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
