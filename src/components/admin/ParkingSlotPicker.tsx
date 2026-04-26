import React, { useEffect, useState, useCallback } from 'react';
import { getCheckinFreeSlots } from '@/services/parking';
import { Loader2, ParkingCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  parkingTypeId: string;
  /** Exclude current booking when re-assigning */
  excludeBookingId?: string;
  vehicleCount: number;
  value: number[];
  onChange: (slots: number[]) => void;
  className?: string;
};

const ParkingSlotPicker: React.FC<Props> = ({
  parkingTypeId,
  excludeBookingId,
  vehicleCount,
  value,
  onChange,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeSlots, setFreeSlots] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!parkingTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCheckinFreeSlots(parkingTypeId, excludeBookingId);
      setFreeSlots(data.freeSlots);
      setTotal(data.totalSpaces);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '無法載入空位');
      setFreeSlots([]);
    } finally {
      setLoading(false);
    }
  }, [parkingTypeId, excludeBookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxPick = Math.max(1, vehicleCount || 1);

  const toggle = (n: number) => {
    const have = new Set(value);
    if (have.has(n)) {
      onChange(value.filter((x) => x !== n));
      return;
    }
    if (value.length >= maxPick) {
      onChange([...value.slice(0, -1), n]);
      return;
    }
    onChange([...value, n].sort((a, b) => a - b));
  };

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground py-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        載入可選車位…
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          重試
        </Button>
      </div>
    );
  }

  if (freeSlots.length < maxPick) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        可選空位不足（需 {maxPick} 格，空位 {freeSlots.length}）。是否已有在場車輛佔用？
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">
        已選 {value.length} / {maxPick} 格 · 全場 {total} 格 · 可點選編號
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 border rounded-md bg-muted/30">
        {freeSlots.map((n) => {
          const on = value.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              className={cn(
                'min-w-[2.25rem] h-9 px-1 rounded-md text-sm font-medium border transition-colors',
                on
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white hover:bg-amber-50 border-border'
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-foreground">
          <ParkingCircle className="h-4 w-4 text-amber-600" />
          已選：{value.join('、')}
        </div>
      )}
    </div>
  );
};

export default ParkingSlotPicker;
