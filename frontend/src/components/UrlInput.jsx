import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { useMutation } from '@tanstack/react-query';
import { Globe, Loader2 } from 'lucide-react';

const UrlInput = () => {
  const [inputValue, setInputValue] = useState('');
  const { 
    setUrl, 
    setScrapeStatus, 
    addScrapingLog, 
    clearScrapingLogs, 
    clearMessages, 
    scrapeStatus 
  } = useAppStore();

  const scrapeMutation = useMutation({
    mutationFn: async (url) => {
      const response = await fetch('http://localhost:8000/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate scrape');
      }
      
      return response.json();
    },
    onMutate: () => {
      setScrapeStatus('scraping');
      clearScrapingLogs();
      clearMessages();
      addScrapingLog(`Initializing connection to target host...`);
      addScrapingLog(`Resolving URL structure...`);
      
      // Simulate live action since the backend is blocking
      setTimeout(() => addScrapingLog('Bypassing standard protections...'), 1500);
      setTimeout(() => addScrapingLog('Fetching DOM layout...'), 3500);
      setTimeout(() => addScrapingLog('Extracting product metadata (Title, Price, Features)...'), 6000);
      setTimeout(() => addScrapingLog('Aggregating reviews and specifications...'), 8500);
    },
    onSuccess: (data) => {
      addScrapingLog(`Data extraction complete. Status: ${data.status}`);
      addScrapingLog(`Payload size: ${data.preview?.length || 0} chars. Processing payload...`);
      setTimeout(() => {
        setScrapeStatus('success');
      }, 1000);
    },
    onError: (error) => {
      addScrapingLog(`[CRITICAL ERROR] Failed to extract data: ${error.message}`);
      setScrapeStatus('error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setUrl(inputValue.trim());
    scrapeMutation.mutate(inputValue.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-zinc-950 p-6 rounded-lg border border-zinc-800 shadow-2xl font-mono">
      <div className="mb-4">
        <h2 className="text-xl text-zinc-100 flex items-center tracking-widest uppercase mb-1">
          <Globe className="w-5 h-5 mr-3 text-zinc-400" />
          Target_Acquisition
        </h2>
        <p className="text-zinc-500 text-xs uppercase tracking-wider">Enter target ecommerce URL to commence data extraction</p>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
            {'>'}
          </div>
          <input
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={scrapeStatus === 'scraping'}
            placeholder="https://example.com/product/..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 block pl-10 p-3 transition-colors disabled:opacity-50 outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={scrapeStatus === 'scraping' || !inputValue.trim()}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-300 font-bold py-3 px-8 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center min-w-[160px]"
        >
          {scrapeStatus === 'scraping' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing
            </>
          ) : (
            'Execute'
          )}
        </button>
      </form>
    </div>
  );
};

export default UrlInput;
