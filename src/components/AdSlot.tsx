import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdSlotProps {
  adSlot: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
}

export function AdSlot({ adSlot, format = 'auto', className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded (dev mode, adblocker, etc.)
    }
  }, []);

  // Replace AD_CLIENT_ID with your actual ca-pub-XXXXXXX after AdSense approval
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT || '';

  // Don't render anything if no client ID configured
  if (!adClient) {
    return (
      <div className={`border border-dashed border-terminal-border bg-terminal-dark/50 flex items-center justify-center ${className}`}>
        <span className="text-[8px] text-terminal-border tracking-widest uppercase font-mono">
          AD SPACE
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
