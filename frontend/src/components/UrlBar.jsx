import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { useMutation } from '@tanstack/react-query';
import { Globe, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';

const UrlBar = () => {
  const [inputValue, setInputValue] = useState('');
  const {
    setUrl,
    url,
    setScrapeStatus,
    addScrapingLog,
    clearScrapingLogs,
    clearMessages,
    scrapeStatus,
  } = useAppStore();

  const scrapeMutation = useMutation({
    mutationFn: async (url) => {
      const response = await fetch('http://localhost:8000/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to scrape');
      }
      return response.json();
    },
    onMutate: () => {
      setScrapeStatus('scraping');
      clearScrapingLogs();
      clearMessages();
      addScrapingLog('Initializing crawler...');
      setTimeout(() => addScrapingLog('Resolving URL & bypassing bot detection...'), 800);
      setTimeout(() => addScrapingLog('Fetching page DOM...'), 2200);
      setTimeout(() => addScrapingLog('Extracting product metadata (Title, Price, Rating)...'), 4500);
      setTimeout(() => addScrapingLog('Aggregating reviews and specifications...'), 7000);
    },
    onSuccess: (data) => {
      addScrapingLog(`✓ Extraction complete — ${data.status}. Payload ready.`);
      setTimeout(() => setScrapeStatus('success'), 800);
    },
    onError: (error) => {
      addScrapingLog(`✗ Critical failure: ${error.message}`);
      setScrapeStatus('error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setUrl(inputValue.trim());
    scrapeMutation.mutate(inputValue.trim());
  };

  const handleReset = () => {
    setInputValue('');
    clearMessages();
    clearScrapingLogs();
    setScrapeStatus('idle');
    setUrl('');
  };

  const isScraping = scrapeStatus === 'scraping';

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-3xl mx-auto">
      <div className="relative flex-1 flex items-center">
        <Globe className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isScraping}
          placeholder="Paste an ecommerce product URL..."
          className="w-full bg-background border border-border text-foreground text-sm rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 placeholder:text-muted-foreground"
          required
        />
        {(inputValue || url) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            tooltip="Clear URL"
            onClick={handleReset}
            className="absolute right-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <button
        type="submit"
        disabled={isScraping || !inputValue.trim()}
        className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
      >
        {isScraping ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
        ) : (
          'Analyze'
        )}
      </button>
    </form>
  );
};

export default UrlBar;
