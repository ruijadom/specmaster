import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PricingCardSkeletonProps {
  popular?: boolean;
}

function PricingCardSkeleton({ popular }: PricingCardSkeletonProps) {
  return (
    <Card className={cn(
      'relative flex flex-col',
      popular && 'border-primary shadow-lg scale-105'
    )}>
      {popular && (
        <Skeleton className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full" />
      )}

      <CardHeader className="text-center pb-4">
        {/* Icon */}
        <div className="mx-auto mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        {/* Title */}
        <Skeleton className="h-7 w-20 mx-auto mb-2" />
        {/* Description */}
        <Skeleton className="h-4 w-36 mx-auto" />
        {/* Price */}
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <li key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function PricingGridSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <PricingCardSkeleton />
      <PricingCardSkeleton popular />
      <PricingCardSkeleton />
    </div>
  );
}
