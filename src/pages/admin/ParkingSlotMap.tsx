import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getParkingSlotSnapshot, type SlotSnapshotLot } from '@/services/parking';
import { getBookingDetails } from '@/services/booking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Car,
  RefreshCw,
  MapPin,
  Film,
  ParkingCircle,
} from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function chunkSlots<T>(arr: T[], perRow: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += perRow) {
    out.push(arr.slice(i, i + perRow));
  }
  return out;
}

function pickCols(total: number): number {
  if (total <= 10) return 5;
  if (total <= 24) return 6;
  if (total <= 40) return 8;
  return 10;
}

const SlotGrid: React.FC<{
  lot: SlotSnapshotLot;
  onSelectBooking: (id: string) => void;
}> = ({ lot, onSelectBooking }) => {
  const cols = useMemo(() => pickCols(lot.slots.length), [lot.slots.length]);
  const rows = useMemo(
    () => chunkSlots(lot.slots, cols),
    [lot.slots, cols]
  );
  const accent = lot.parkingType.color || '#39653f';
  const occupied = lot.slots.filter((s) => s.booking).length;
  const free = lot.slots.length - occupied;

  return (
    <div className="space-y-4">
      {lot.unassignedCheckedIn && lot.unassignedCheckedIn.length > 0 && (
        <div className="text-sm text-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-3 py-2.5 shadow-sm">
          有 {lot.unassignedCheckedIn.length} 輛在場但尚未分配車位（請於「預約」內分步入場或編輯補上）。
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          空位 <strong className="font-semibold tabular-nums">{free}</strong>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          已佔 <strong className="font-semibold tabular-nums">{occupied}</strong>
        </div>
        <div className="text-muted-foreground">
          共 <span className="font-medium text-foreground tabular-nums">{lot.slots.length}</span> 格
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-slate-100/50 p-4 sm:p-6 shadow-sm"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}18` }}
      >
        <div className="flex flex-col items-center gap-1.5 mb-4 sm:mb-5">
          <div
            className="w-full max-w-2xl rounded-t-xl py-2.5 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide text-white shadow-md flex items-center justify-center gap-2 ring-1 ring-white/20"
            style={{
              background: `linear-gradient(180deg, ${accent} 0%, #0f172a 100%)`,
            }}
          >
            <Film className="h-4 w-4 opacity-90 shrink-0" aria-hidden />
            <span>入口 / 主車道</span>
          </div>
          <div
            className="h-1.5 w-[88%] max-w-xl rounded-full opacity-90"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
            aria-hidden
          />
        </div>

        <div className="space-y-2.5 sm:space-y-3" role="group" aria-label="車位格配置">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="flex items-stretch justify-center gap-1.5 sm:gap-2"
          >
            <span
              className="hidden sm:flex w-6 shrink-0 items-center justify-center text-[10px] font-mono text-muted-foreground/80 pt-0.5"
              aria-hidden
            >
              {ri + 1}
            </span>
            <div
              className="grid w-full min-w-0 max-w-2xl flex-1 gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
            >
            {row.map(({ slotNumber, booking }) => {
              if (booking) {
                return (
              <button
                key={slotNumber}
                type="button"
                onClick={() => onSelectBooking(booking._id)}
                className={cn(
                    'group relative flex min-h-[3.5rem] w-full flex-col items-center justify-between rounded-xl border-2 border-amber-400/90 bg-gradient-to-b from-slate-600 to-slate-900 px-0.5 py-1.5',
                    'text-white shadow-md transition-all hover:z-[1] hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-amber-400/70',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                    'sm:min-h-[4.25rem] sm:px-1'
                )}
                title={`車位 ${slotNumber} — ${booking.licensePlate}，點擊看明細`}
                aria-label={`車位 ${slotNumber}，車牌 ${booking.licensePlate}，點擊看預約明細`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-amber-200/90 tabular-nums">
                  {slotNumber}
                </span>
                <Car
                  className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300 transition-transform group-hover:scale-110"
                  aria-hidden
                />
                <span className="w-full break-all px-0.5 text-center text-[9px] sm:text-[10px] font-semibold leading-tight line-clamp-2">
                  {booking.licensePlate}
                </span>
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-900 shadow sm:h-5 sm:w-5">
                  i
                </span>
              </button>
                );
              }
              return (
                <div
                  key={slotNumber}
                  className={cn(
                    'flex min-h-[3.5rem] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300/90',
                    'bg-white/60 text-slate-400 sm:min-h-[4.25rem]',
                    'pointer-events-none select-none'
                  )}
                  title={`空位 ${slotNumber}`}
                >
                  <span className="text-[10px] sm:text-xs font-mono tabular-nums text-slate-500">{slotNumber}</span>
                  <ParkingCircle className="mt-0.5 h-4 w-4 opacity-40" aria-hidden />
                  <span className="mt-0.5 text-[9px] text-emerald-600/80">空</span>
                </div>
              );
            })}
            </div>
          </div>
        ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>已佔車位可點擊，右上角 <span className="font-mono">i</span> 圓標表示可開啟明細</span>
      </p>
    </div>
  );
};

const ParkingSlotMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState<string>('');
  const [lots, setLots] = useState<SlotSnapshotLot[]>([]);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getParkingSlotSnapshot();
      setServerTime(res.serverTime);
      setLots(res.lots);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetails = async (id: string) => {
    setDetailOpen(true);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const b = await getBookingDetails(id);
      setDetail(b);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '無法載入明細');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading && !lots.length) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        載入即時車位圖…
      </div>
    );
  }

  if (!loading && (!lots || lots.length === 0)) {
    return (
      <div className="max-w-5xl mx-auto text-center text-muted-foreground py-12">
        <p>沒有啟用中的停車場類型</p>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          重新整理
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            即時車位圖
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
            以平面格狀顯示各格編號；空位與已佔用者有不同外觀。伺服器時間：{' '}
            <time dateTime={serverTime || undefined} className="font-medium text-foreground/80 tabular-nums">
              {serverTime ? formatDateTime(serverTime) : '—'}
            </time>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 border-[#39653f]/30 hover:bg-[#39653f]/5"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          重新整理
        </Button>
      </div>

      <Tabs defaultValue={lots[0].parkingType._id} className="w-full">
        <TabsList
          className="inline-flex h-auto w-full max-w-full flex-wrap justify-start gap-1 rounded-xl border border-border/80 bg-muted/40 p-1.5"
        >
          {lots.map((lot) => (
            <TabsTrigger
              key={lot.parkingType._id}
              value={lot.parkingType._id}
              className="rounded-lg border border-transparent px-3 py-2 text-sm data-[state=active]:border-[#39653f]/25 data-[state=active]:bg-[#39653f] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <span className="mr-1.5" aria-hidden>
                {lot.parkingType.icon}
              </span>
              {lot.parkingType.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.parkingType._id} value={lot.parkingType._id} className="mt-5 outline-none">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-gradient-to-r from-[#39653f]/6 to-transparent pb-3">
                <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-lg">
                  <span className="text-[#39653f]">{lot.parkingType.name}</span>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    共 {lot.parkingType.totalSpaces} 格
                  </span>
                </CardTitle>
                <CardDescription className="text-sm">
                  上方為主車道／入口方向，下方依編號排列；列數會依總格數自動換行。
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 sm:pt-6">
                <SlotGrid lot={lot} onSelectBooking={openDetails} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col gap-0 sm:max-w-md">
          <DialogHeader className="space-y-1 border-b border-border/60 pb-3 text-left">
            <DialogTitle className="text-lg">租賃 / 預約明細</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              由車位圖點選開啟，資料來自預約記錄。
            </DialogDescription>
          </DialogHeader>
          {loadingDetail && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              載入中…
            </div>
          )}
          {!loadingDetail && detail && (
            <ScrollArea className="max-h-[60vh] pr-2">
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1">
                  <dt className="text-muted-foreground">預約 ID</dt>
                  <dd className="font-mono text-xs break-all text-foreground">{String(detail._id)}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">車牌</dt>
                  <dd className="font-semibold text-foreground">{detail.licensePlate}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">聯絡人</dt>
                  <dd>{detail.driverName}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">電話</dt>
                  <dd className="tabular-nums">{detail.phone}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">狀態</dt>
                  <dd><span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">{detail.status}</span></dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">預定進場</dt>
                  <dd className="tabular-nums">{formatDateTime(detail.checkInTime)}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">預定離場</dt>
                  <dd className="tabular-nums">{formatDateTime(detail.checkOutTime)}</dd>
                </div>
                {detail.parkingSlotNumbers && detail.parkingSlotNumbers.length > 0 && (
                  <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                    <dt className="text-muted-foreground">車位</dt>
                    <dd className="font-medium tabular-nums">{detail.parkingSlotNumbers.join('、')}</dd>
                  </div>
                )}
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground">金額</dt>
                  <dd className="font-semibold tabular-nums text-[#39653f]">
                    {detail.finalAmount?.toLocaleString('zh-TW', {
                      style: 'currency',
                      currency: 'TWD',
                      minimumFractionDigits: 0,
                    })}
                  </dd>
                </div>
                {detail.notes && (
                  <div className="grid grid-cols-1 gap-1">
                    <dt className="text-muted-foreground">備註</dt>
                    <dd className="whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-xs">{detail.notes}</dd>
                  </div>
                )}
              </dl>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParkingSlotMap;
