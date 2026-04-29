import React, { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

const ScrapingLogs = () => {
  const logs = useAppStore((s) => s.scrapingLogs);
  const status = useAppStore((s) => s.scrapeStatus);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <div className="border border-border rounded-xl overflow-hidden font-mono text-xs">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          </div>
          <span className="ml-auto text-muted-foreground tracking-widest uppercase text-[10px]">
            {status === 'scraping' ? '● CRAWLING' : '✓ COMPLETE'}
          </span>
        </div>

        {/* Log lines */}
        <div className="bg-background px-4 py-4 space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4">
              <span className="text-muted-foreground/50 w-20 flex-shrink-0 tabular-nums">
                {log.time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`${log.text.startsWith('✓') ? 'text-foreground' : log.text.startsWith('✗') ? 'text-destructive' : 'text-muted-foreground'}`}>
                {log.text}
              </span>
            </div>
          ))}
          {status === 'scraping' && (
            <div className="flex gap-4">
              <span className="text-muted-foreground/50 w-20 flex-shrink-0">__:__:__</span>
              <span className="text-muted-foreground animate-pulse">▋</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default ScrapingLogs;
