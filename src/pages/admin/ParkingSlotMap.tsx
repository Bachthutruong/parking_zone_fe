import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getParkingSlotSnapshot, type SlotSnapshotLot } from '@/services/parking';
import { getBookingDetails } from '@/services/booking';
import { updateBooking } from '@/services/admin';
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
  const onGrid = lot.slots.filter((s) => s.booking).length;
  const unassigned = lot.unassignedCheckedIn ?? [];
  const inLot = onGrid + unassigned.length;
  const free = lot.slots.length - onGrid;

  return (
    <div className="space-y-4 w-full">
      {unassigned.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50/90 to-amber-100/50 p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-sm font-bold text-amber-900 sm:text-base">
              在場但尚未分配編號車位
              <span className="ml-2 font-mono text-base tabular-nums sm:text-lg">（{unassigned.length} 輛）</span>
            </h3>
            <p className="text-xs leading-snug text-amber-800/90 sm:max-w-xl sm:text-right sm:text-sm">
              入場時若未選格，不會出現在下方格子。請至「預約」編輯補車位，或改回狀態再入場並選格。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => onSelectBooking(b._id)}
                className="group inline-flex min-h-[2.75rem] min-w-[7rem] flex-1 flex-col items-center justify-center rounded-xl border-2 border-amber-500/60 bg-white/90 px-3 py-2 text-left shadow transition hover:border-amber-600 hover:shadow-md sm:max-w-[11rem] sm:flex-initial"
              >
                <span className="text-xs text-amber-800/80">未編號 · 在場</span>
                <span className="font-mono text-sm font-bold text-amber-950 sm:text-base">{b.licensePlate}</span>
                <span className="w-full truncate text-center text-[11px] text-slate-600">{b.driverName || '—'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          空編號格 <strong className="font-semibold tabular-nums">{free}</strong>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-800">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          圖上已顯示 <strong className="font-semibold tabular-nums">{onGrid}</strong>
        </div>
        {unassigned.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            在場未編號 <strong className="font-semibold tabular-nums">{unassigned.length}</strong>
          </div>
        )}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#39653f]/30 bg-[#39653f]/8 px-2.5 py-1 text-[#1d4b32]">
          <Car className="h-3.5 w-3.5" />
          本場在場 <strong className="font-semibold tabular-nums">{inLot}</strong>
        </div>
        <div className="text-muted-foreground pl-1">
          編號格共 <span className="font-medium text-foreground tabular-nums">{lot.slots.length}</span> 格
        </div>
      </div>

      <div
        className="w-full rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-slate-100/50 p-3 sm:p-6 shadow-sm"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}18` }}
      >
        <div className="mb-4 flex flex-col items-center gap-1.5 sm:mb-5">
          <div
            className="w-full max-w-4xl rounded-t-xl py-2.5 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide text-white shadow-md flex items-center justify-center gap-2 ring-1 ring-white/20"
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
              className="grid w-full min-w-0 flex-1 gap-1.5 sm:gap-2"
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
                    'group relative flex min-h-[3.5rem] w-full max-w-[5.25rem] flex-col items-center justify-between justify-self-center rounded-xl border-2 border-amber-400/90 bg-gradient-to-b from-slate-600 to-slate-900 px-0.5 py-1.5',
                    'text-white shadow-md transition-all hover:z-[1] hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-amber-400/70',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                    'sm:min-h-[4.25rem] sm:max-w-[5.5rem] sm:px-1'
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
                    'flex min-h-[3.5rem] w-full max-w-[5.25rem] flex-col items-center justify-center justify-self-center rounded-xl border-2 border-dashed border-slate-300/90',
                    'bg-white/60 text-slate-400 sm:min-h-[4.25rem] sm:max-w-[5.5rem]',
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
  const [editingSlot, setEditingSlot] = useState(false);
  const [slotNumbersInput, setSlotNumbersInput] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);

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
      setSlotNumbersInput(b.parkingSlotNumbers?.join(', ') || '');
      setEditingSlot(false);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '無法載入明細');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateSlot = async () => {
    if (!detail) return;
    setSavingSlot(true);
    try {
      const newSlots = slotNumbersInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      await updateBooking(detail._id, { parkingSlotNumbers: newSlots });
      toast.success('車位更新成功');
      setDetail({ ...detail, parkingSlotNumbers: newSlots });
      setEditingSlot(false);
      void load();
    } catch (e: unknown) {
      toast.error('無法更新車位');
    } finally {
      setSavingSlot(false);
    }
  };

  const allSlots = useMemo(() => {
    if (!detail || !lots) return [];
    const lot = lots.find((l) => l.parkingType._id === detail.parkingType._id);
    if (!lot) return [];
    
    return lot.slots;
  }, [detail, lots]);

  const toggleSlot = (slot: string) => {
    const current = slotNumbersInput.split(',').map(s => s.trim()).filter(Boolean);
    const maxSlots = detail?.vehicleCount || 1;

    if (current.includes(slot)) {
      setSlotNumbersInput(current.filter(s => s !== slot).join(', '));
    } else {
      if (maxSlots === 1) {
        setSlotNumbersInput(slot);
      } else {
        if (current.length >= maxSlots) {
          toast.error(`此預約最多只能分配 ${maxSlots} 個車位`);
          return;
        }
        setSlotNumbersInput([...current, slot].join(', '));
      }
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
      <div className="w-full max-w-full text-center text-muted-foreground py-12">
        <p>沒有啟用中的停車場類型</p>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          重新整理
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            即時車位圖
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-4xl leading-relaxed">
            有分配編號的車輛顯示在格內；入場時未選位者顯示於上方黃色區。伺服器時間：{' '}
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
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                  <dt className="text-muted-foreground mt-1">車位</dt>
                  <dd>
                    {editingSlot ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 border rounded-md bg-slate-50">
                          {allSlots.length > 0 ? allSlots.map(slotObj => {
                            const slotStr = String(slotObj.slotNumber);
                            const isSelected = slotNumbersInput.split(',').map(s => s.trim()).filter(Boolean).includes(slotStr);
                            const isOccupiedByOther = slotObj.booking && slotObj.booking._id !== detail._id;
                            return (
                              <button
                                key={slotStr}
                                type="button"
                                onClick={() => {
                                  if (!isOccupiedByOther) toggleSlot(slotStr);
                                }}
                                disabled={Boolean(isOccupiedByOther)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded border font-medium transition-colors",
                                  isSelected 
                                    ? "bg-[#39653f] text-white border-[#2c4e30]" 
                                    : isOccupiedByOther
                                      ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                )}
                                title={isOccupiedByOther ? `已被 ${slotObj.booking?.licensePlate} 佔用` : `選擇車位 ${slotStr}`}
                              >
                                {slotStr}
                              </button>
                            );
                          }) : (
                            <span className="text-xs text-muted-foreground p-1">無車位資料</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button 
                            size="sm" 
                            onClick={handleUpdateSlot} 
                            disabled={savingSlot}
                            className="h-8 shrink-0 bg-[#39653f] hover:bg-[#2c4e30]"
                          >
                            {savingSlot ? '儲存中...' : '儲存車位'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditingSlot(false);
                              setSlotNumbersInput(detail.parkingSlotNumbers?.join(', ') || '');
                            }}
                            disabled={savingSlot}
                            className="h-8 shrink-0"
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center group">
                        <span className="font-medium tabular-nums">
                          {detail.parkingSlotNumbers && detail.parkingSlotNumbers.length > 0 
                            ? detail.parkingSlotNumbers.join('、') 
                            : '尚未分配'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs text-[#39653f] hover:text-[#2c4e30] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingSlot(true)}
                        >
                          更改車位
                        </Button>
                      </div>
                    )}
                  </dd>
                </div>
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
