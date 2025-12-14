import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

function ChatMessageSkeleton({ isAssistant = false }: { isAssistant?: boolean }) {
  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
      <div className={`space-y-2 ${isAssistant ? 'max-w-[80%]' : 'max-w-[70%]'}`}>
        <Skeleton className={`h-4 ${isAssistant ? 'w-64' : 'w-48'}`} />
        <Skeleton className={`h-4 ${isAssistant ? 'w-80' : 'w-32'}`} />
        {isAssistant && <Skeleton className="h-4 w-56" />}
      </div>
    </div>
  );
}

export function ChatAreaSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      <ChatMessageSkeleton isAssistant />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isAssistant />
      <ChatMessageSkeleton isAssistant />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isAssistant />
    </div>
  );
}

function AnalysisCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </Card>
  );
}

export function AnalysisPanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <Skeleton className="h-3 w-24" />
      <AnalysisCardSkeleton />
      <AnalysisCardSkeleton />
      <AnalysisCardSkeleton />
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function MissionControlSkeleton() {
  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-14 border-b border-border flex items-center px-4 gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        {/* Chat area */}
        <ChatAreaSkeleton />

        {/* Input area */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-2xl border border-border bg-muted/30">
            <Skeleton className="h-4 w-4 rounded ml-2" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-48 mx-auto mt-3" />
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:block w-80 border-l border-border">
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <AnalysisPanelSkeleton />
      </div>
    </div>
  );
}
