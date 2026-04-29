import React, { useState } from 'react';
import UrlBar from '../components/UrlBar';
import ScrapingLogs from '../components/ScrapingLogs';
import ChatMessages, { ChatInput, EmptyState } from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import useAppStore from '../store/useAppStore';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';

const HomePage = () => {
  const { scrapeStatus, setInput } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-svh overflow-hidden">
        <header className="shrink-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border py-3">
          <div className="max-w-3xl mx-auto px-4 flex items-center gap-4">
            <SidebarTrigger className={"absolute left-4"} tooltip="Toggle sidebar" />
            <UrlBar />
          </div>
        </header>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">

          {/* Main Scrollable Body */}
          <main className="flex-1 w-full flex flex-col overflow-y-auto relative">
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
              {scrapeStatus === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[50vh]">
                  <h1 className="text-3xl font-semibold mb-2">What product do you want to explore?</h1>
                  <p className="text-muted-foreground">Paste an e-commerce URL above to get started.</p>
                </div>
              )}

              {scrapeStatus === 'scraping' && (
                <div className="w-full mt-8 flex-1">
                  <ScrapingLogs />
                </div>
              )}

              {scrapeStatus === 'error' && (
                <div className="w-full mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
                  <p className="font-medium">Failed to analyze the product.</p>
                  <p className="text-sm opacity-80 mt-1">Please check the URL and try again.</p>
                </div>
              )}

              {scrapeStatus === 'success' && (
                <div className="flex-1 w-full">
                  <ScrapingLogs />
                  <div className="mt-4">
                    <ChatMessages />
                  </div>
                </div>
              )}
            </div>

            {scrapeStatus === 'success' && <ChatInput />}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default HomePage;
