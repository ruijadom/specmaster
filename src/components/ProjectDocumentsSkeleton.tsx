import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/20">
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-6 w-10" />
    </div>
  );
}

function DocumentRowSkeleton() {
  return (
    <TableRow className="border-b border-border">
      <TableCell className="py-4 px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="py-4 px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function AnalysisRowSkeleton() {
  return (
    <TableRow className="border-b border-border">
      <TableCell className="py-4 px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Skeleton className="h-5 w-24 rounded-full" />
      </TableCell>
      <TableCell className="py-4 px-6">
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="py-4 px-6">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProjectDocumentsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Documents Table */}
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card/30 shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
                  <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[35%]">
                    <Skeleton className="h-3 w-24" />
                  </TableHead>
                  <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[20%]">
                    <Skeleton className="h-3 w-12" />
                  </TableHead>
                  <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[25%]">
                    <Skeleton className="h-3 w-20" />
                  </TableHead>
                  <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[15%]">
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                  <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider text-right w-[5%]">
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm divide-y divide-border">
                <DocumentRowSkeleton />
                <DocumentRowSkeleton />
                <DocumentRowSkeleton />
                <DocumentRowSkeleton />
              </TableBody>
            </Table>
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
