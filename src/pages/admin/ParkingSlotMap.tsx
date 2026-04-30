import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getParkingSlotSnapshot, type SlotSnapshotLot } from '@/services/parking';
import { getBookingDetails, calculatePrice } from '@/services/booking';
import { updateBooking, updateBookingStatus, getAllParkingTypes } from '@/services/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateInput from '@/components/ui/date-input';
import ParkingSlotPicker from '@/components/admin/ParkingSlotPicker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

import {
  Car,
  RefreshCw,
  MapPin,
  Film,
  ParkingCircle,
  RotateCcw,
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

const EDIT_STATUS_OPTIONS = [
  { value: 'pending', label: '等待進入停車場' },
  { value: 'confirmed', label: '預約成功' },
  { value: 'checked-in', label: '已進入停車場' },
  { value: 'checked-out', label: '已離開停車場' },
  { value: 'cancelled', label: '已取消' },
] as const;

interface EditBookingForm {
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  notes: string;
  vehicleCount: number;
  parkingSlotNumbers: number[];
}

const ParkingSlotMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState<string>('');
  const [lots, setLots] = useState<SlotSnapshotLot[]>([]);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState<EditBookingForm>({
    driverName: '', phone: '', email: '', licensePlate: '',
    parkingTypeId: '', checkInTime: '', checkOutTime: '',
    status: 'confirmed', notes: '', vehicleCount: 1, parkingSlotNumbers: [],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  const [newPriceLoading, setNewPriceLoading] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newPriceError, setNewPriceError] = useState<string | null>(null);
  const [shouldRecalcPrice, setShouldRecalcPrice] = useState(false);

  // Status change dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ bookingId: string; status: string; licensePlate: string } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [checkInSlots, setCheckInSlots] = useState<number[]>([]);
  const [statusChangeParkingTypeId, setStatusChangeParkingTypeId] = useState('');

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

  useEffect(() => {
    const loadParkingTypes = async () => {
      try {
        const data = await getAllParkingTypes();
        setParkingTypes(data.parkingTypes || []);
      } catch (error) {
        console.error('Failed to load parking types:', error);
      }
    };
    loadParkingTypes();
  }, []);

  const openDetails = async (id: string) => {
    setDetailOpen(true);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const b = await getBookingDetails(id);
      setDetail(b);
      const ptId = typeof b.parkingType === 'object' && b.parkingType?._id
        ? b.parkingType._id : (b as any).parkingType ?? '';
      setEditForm({
        driverName: b.driverName ?? '',
        phone: b.phone ?? '',
        email: b.email ?? '',
        licensePlate: b.licensePlate ?? '',
        parkingTypeId: ptId,
        checkInTime: b.checkInTime ?? '',
        checkOutTime: b.checkOutTime ?? '',
        status: b.status ?? 'confirmed',
        notes: (b as any).notes ?? '',
        vehicleCount: b.vehicleCount ?? 1,
        parkingSlotNumbers: Array.isArray(b.parkingSlotNumbers) ? [...b.parkingSlotNumbers] : [],
      });
      setNewPrice(null);
      setNewPriceError(null);
      setShouldRecalcPrice(false);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '無法載入明細');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeEditDialog = () => {
    setDetailOpen(false);
    setDetail(null);
    setEditSaving(false);
    setNewPrice(null);
    setNewPriceError(null);
    setShouldRecalcPrice(false);
  };

  // Recalculate price when relevant fields change
  useEffect(() => {
    if (!detail || !editForm.parkingTypeId || !editForm.checkInTime || !editForm.checkOutTime) {
      setNewPrice(null);
      setNewPriceError(null);
      return;
    }
    if (!shouldRecalcPrice) return;
    const checkIn = new Date(editForm.checkInTime);
    const checkOut = new Date(editForm.checkOutTime);
    if (checkOut <= checkIn) {
      setNewPrice(null);
      setNewPriceError('離開時間須晚於進入時間');
      return;
    }
    let cancelled = false;
    setNewPriceLoading(true);
    setNewPriceError(null);
    calculatePrice({
      parkingTypeId: editForm.parkingTypeId,
      checkInTime: editForm.checkInTime,
      checkOutTime: editForm.checkOutTime,
      addonServices: (detail.addonServices || []).map((a) => (a as any).service?._id || (a as any)._id).filter(Boolean),
      discountCode: detail.discountCode?.code,
      isVIP: detail.isVIP,
      userEmail: detail.email,
      vehicleCount: editForm.vehicleCount || 1,
    } as any)
      .then((res: any) => {
        if (cancelled) return;
        if (res?.pricing?.finalAmount != null) {
          setNewPrice(res.pricing.finalAmount);
          setNewPriceError(null);
        } else {
          setNewPrice(null);
          setNewPriceError(res?.message || '無法計算新價格');
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        setNewPrice(null);
        setNewPriceError(err?.response?.data?.message || '無法計算新價格');
      })
      .finally(() => { if (!cancelled) setNewPriceLoading(false); });
    return () => { cancelled = true; };
  }, [detail, editForm.parkingTypeId, editForm.checkInTime, editForm.checkOutTime, editForm.vehicleCount, shouldRecalcPrice]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    const vc = Math.max(1, editForm.vehicleCount || 1);
    if (editForm.status === 'checked-in') {
      if (editForm.parkingSlotNumbers.length !== vc) {
        toast.error(`狀態為「已進入停車場」時須選好 ${vc} 個實體車位`);
        return;
      }
    }
    try {
      setEditSaving(true);
      const payload: any = {
        driverName: editForm.driverName,
        phone: editForm.phone,
        email: editForm.email || undefined,
        licensePlate: editForm.licensePlate,
        parkingType: editForm.parkingTypeId || undefined,
        checkInTime: editForm.checkInTime,
        checkOutTime: editForm.checkOutTime,
        vehicleCount: editForm.vehicleCount || 1,
        status: editForm.status,
        notes: editForm.notes || undefined,
        ...(editForm.status === 'checked-in' && editForm.parkingSlotNumbers.length > 0
          ? { parkingSlotNumbers: editForm.parkingSlotNumbers }
          : {}),
      };
      // Recalculate price
      try {
        const res: any = await calculatePrice({
          parkingTypeId: editForm.parkingTypeId,
          checkInTime: editForm.checkInTime,
          checkOutTime: editForm.checkOutTime,
          addonServices: (detail.addonServices || []).map((a: any) => a.service?._id || a._id).filter(Boolean),
          discountCode: detail.discountCode?.code,
          isVIP: detail.isVIP,
          userEmail: detail.email,
          vehicleCount: editForm.vehicleCount || 1,
        } as any);
        const pricing = res?.pricing;
        if (pricing && pricing.finalAmount != null) {
          payload.totalAmount = pricing.totalAmount ?? pricing.finalAmount;
          payload.discountAmount = pricing.discountAmount ?? 0;
          payload.finalAmount = pricing.finalAmount;
          if (pricing.autoDiscountAmount != null) payload.autoDiscountAmount = pricing.autoDiscountAmount;
          if (pricing.dailyPrices) payload.dailyPrices = pricing.dailyPrices;
        }
      } catch (err) {
        console.error('Recalculate price failed:', err);
      }
      await updateBooking(detail._id, payload as Parameters<typeof updateBooking>[1]);
      toast.success('已更新預約資訊');
      closeEditDialog();
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '更新失敗');
    } finally {
      setEditSaving(false);
    }
  };

  const openStatusChangeDialog = (booking: Booking, newStatus: string) => {
    const ptId = typeof booking.parkingType === 'object' && booking.parkingType?._id
      ? booking.parkingType._id : '';
    setStatusChangeTarget({ bookingId: booking._id, status: newStatus, licensePlate: booking.licensePlate });
    setStatusReason('');
    setStatusChangeParkingTypeId(ptId);
    setCheckInSlots(newStatus === 'checked-in' && Array.isArray(booking.parkingSlotNumbers) ? [...booking.parkingSlotNumbers] : []);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    const vc = Math.max(1, detail?.vehicleCount || 1);
    if (statusChangeTarget.status === 'checked-in') {
      if (checkInSlots.length !== vc) {
        toast.error(`入場須選擇 ${vc} 個空車位`);
        return;
      }
    }
    try {
      await updateBookingStatus(
        statusChangeTarget.bookingId,
        statusChangeTarget.status,
        statusReason,
        statusChangeTarget.status === 'checked-in' ? checkInSlots : undefined
      );
      toast.success('狀態更新成功');
      setIsStatusDialogOpen(false);
      setStatusChangeTarget(null);
      setCheckInSlots([]);
      
      // Delay closing the outer dialog to allow Radix UI to properly remove body pointer-events lock
      setTimeout(() => {
        closeEditDialog();
        void load();
      }, 300);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || '狀態更新失敗');
    }
  };

  const handleRevertStatus = (booking: Booking) => {
    let newStatus = '';
    if (booking.status === 'checked-in') newStatus = 'confirmed';
    else if (booking.status === 'checked-out') newStatus = 'checked-in';
    else if (booking.status === 'cancelled') newStatus = 'confirmed';
    if (newStatus) openStatusChangeDialog(booking, newStatus);
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

      <Dialog open={detailOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent 
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => { if (isStatusDialogOpen) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isStatusDialogOpen) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">編輯預約</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {detail && (detail.bookingNumber ? `預約編號: ${detail.bookingNumber}` : `預約 ID: ${detail._id}`)}
            </DialogDescription>
          </DialogHeader>
          {loadingDetail && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              載入中…
            </div>
          )}
          {!loadingDetail && detail && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slot-edit-driverName">客戶姓名 *</Label>
                  <Input
                    id="slot-edit-driverName"
                    value={editForm.driverName}
                    onChange={(e) => setEditForm((f) => ({ ...f, driverName: e.target.value }))}
                    required
                    placeholder="客戶姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-edit-phone">電話 *</Label>
                  <Input
                    id="slot-edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                    placeholder="電話"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-edit-email">Email</Label>
                <Input
                  id="slot-edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-edit-licensePlate">車牌號碼 *</Label>
                <Input
                  id="slot-edit-licensePlate"
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm((f) => ({ ...f, licensePlate: e.target.value }))}
                  required
                  placeholder="車牌號碼"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-edit-parkingType">停車場 *</Label>
                <Select
                  value={editForm.parkingTypeId}
                  onValueChange={(value) => {
                    setEditForm((f) => ({ ...f, parkingTypeId: value }));
                    setShouldRecalcPrice(true);
                  }}
                >
                  <SelectTrigger id="slot-edit-parkingType">
                    <SelectValue placeholder="選擇停車場" />
                  </SelectTrigger>
                  <SelectContent>
                    {parkingTypes.map((pt) => (
                      <SelectItem key={pt._id} value={pt._id}>
                        {pt.icon || '🏢'} {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slot-edit-checkInTime">進入時間 *</Label>
                  <DateInput
                    id="slot-edit-checkInTime"
                    type="datetime-local"
                    value={editForm.checkInTime}
                    onChange={(value) => {
                      setEditForm((f) => ({ ...f, checkInTime: value }));
                      setShouldRecalcPrice(true);
                    }}
                    placeholder="年/月/日 00:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-edit-checkOutTime">離開時間 *</Label>
                  <DateInput
                    id="slot-edit-checkOutTime"
                    type="datetime-local"
                    value={editForm.checkOutTime}
                    onChange={(value) => {
                      setEditForm((f) => ({ ...f, checkOutTime: value }));
                      setShouldRecalcPrice(true);
                    }}
                    placeholder="年/月/日 00:00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-edit-vehicleCount">車輛數量 *</Label>
                <Input
                  id="slot-edit-vehicleCount"
                  type="number"
                  min={1}
                  value={editForm.vehicleCount}
                  onChange={(e) => {
                    setEditForm((f) => ({
                      ...f,
                      vehicleCount: Math.max(1, Number(e.target.value) || 1),
                      parkingSlotNumbers: [],
                    }));
                    setShouldRecalcPrice(true);
                  }}
                  placeholder="車輛數量"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-edit-status">狀態</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
                >
                  <SelectTrigger id="slot-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDIT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Quick status action buttons */}
                {detail && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(detail.status === 'pending' || detail.status === 'confirmed') && (
                      <>
                        <Button type="button" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => openStatusChangeDialog(detail, 'checked-in')}>
                          已進入
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => openStatusChangeDialog(detail, 'cancelled')}>
                          取消
                        </Button>
                      </>
                    )}
                    {detail.status === 'checked-in' && (
                      <>
                        <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openStatusChangeDialog(detail, 'checked-out')}>
                          已離開
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleRevertStatus(detail)} title="返回上一狀態">
                          <RotateCcw className="h-4 w-4 mr-1" /> 返回上一狀態
                        </Button>
                      </>
                    )}
                    {detail.status === 'checked-out' && (
                      <Button type="button" size="sm" variant="outline" onClick={() => handleRevertStatus(detail)} title="返回上一狀態">
                        <RotateCcw className="h-4 w-4 mr-1" /> 返回上一狀態
                      </Button>
                    )}
                    {detail.status === 'cancelled' && (
                      <Button type="button" size="sm" variant="outline" onClick={() => handleRevertStatus(detail)} title="恢復預約">
                        <RotateCcw className="h-4 w-4 mr-1" /> 恢復預約
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {editForm.status === 'checked-in' && editForm.parkingTypeId && detail && (
                <div className="space-y-2 rounded-md border p-3 bg-amber-50/50">
                  <Label>實體車位（{editForm.vehicleCount || 1} 格 · 在場用）</Label>
                  <ParkingSlotPicker
                    key={`${detail._id}-${editForm.parkingTypeId}`}
                    parkingTypeId={editForm.parkingTypeId}
                    excludeBookingId={detail._id}
                    vehicleCount={Math.max(1, editForm.vehicleCount || 1)}
                    value={editForm.parkingSlotNumbers}
                    onChange={(parkingSlotNumbers) => setEditForm((f) => ({ ...f, parkingSlotNumbers }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="slot-edit-notes">備註</Label>
                <Input
                  id="slot-edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="備註"
                />
              </div>
              {/* Price comparison */}
              {detail && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">價格比較</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">原價（目前預約）</div>
                      <div className="font-semibold text-base">{detail.finalAmount.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">新價（變更後）</div>
                      {newPriceLoading ? (
                        <div className="text-muted-foreground">計算中...</div>
                      ) : newPrice != null ? (
                        <div className={`font-semibold text-base ${newPrice !== detail.finalAmount ? 'text-amber-600' : ''}`}>
                          {newPrice.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          {newPrice !== detail.finalAmount && (
                            <span className="ml-1 text-xs font-normal">
                              ({newPrice > detail.finalAmount ? '+' : ''}{(newPrice - detail.finalAmount).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-xs">{newPriceError || '變更停車場、時間或車輛數量後顯示'}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditDialog} disabled={editSaving}>
                  取消
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? '儲存中...' : '儲存'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>確認變更狀態</AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeTarget && (
                <>
                  車牌 <strong>{statusChangeTarget.licensePlate}</strong> 的狀態將變更為
                  {statusChangeTarget.status === 'checked-in' ? ' 已進入停車場' :
                   statusChangeTarget.status === 'checked-out' ? ' 已離開停車場' :
                   statusChangeTarget.status === 'cancelled' ? ' 已取消' :
                   statusChangeTarget.status === 'confirmed' ? ' 預約成功' : ` ${statusChangeTarget.status}`}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            {statusChangeTarget?.status === 'checked-in' && statusChangeParkingTypeId && detail && (
              <div className="space-y-2">
                <Label>選擇車位（{detail.vehicleCount || 1} 格）</Label>
                <ParkingSlotPicker
                  key={`status-${detail._id}-${statusChangeParkingTypeId}`}
                  parkingTypeId={statusChangeParkingTypeId}
                  excludeBookingId={detail._id}
                  vehicleCount={Math.max(1, detail.vehicleCount || 1)}
                  value={checkInSlots}
                  onChange={setCheckInSlots}
                />
              </div>
            )}
            {statusChangeTarget?.status === 'cancelled' && (
              <div className="space-y-2">
                <Label htmlFor="slot-status-reason">取消原因</Label>
                <Textarea
                  id="slot-status-reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="請填寫取消原因（選填）"
                  rows={3}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button onClick={confirmStatusChange}>
              確認
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ParkingSlotMap;
