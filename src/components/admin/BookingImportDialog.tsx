import React, { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileSpreadsheet, Loader2, Upload, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  downloadBookingImportTemplate,
  parseBookingImportWorkbook,
  rowToManualBookingPayload,
  type ImportRowParsed,
  type ParkingTypeRef,
} from '@/lib/bookingImport';
import { startOfDayISO, endOfDayISO } from '@/lib/dateUtils';
import { checkAvailability } from '@/services/booking';
import { createManualBooking } from '@/services/admin';
import { cn } from '@/lib/utils';

type LineStatus = 'parse_failed' | 'pending' | 'validating' | 'creating' | 'success' | 'failed';

interface ImportLine {
  sheetRow: number;
  summary: string;
  status: LineStatus;
  detail?: string;
  payload?: ImportRowParsed;
}

export interface BookingImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingTypes: ParkingTypeRef[];
  onFinished?: () => void;
}

export const BookingImportDialog: React.FC<BookingImportDialogProps> = ({
  open,
  onOpenChange,
  parkingTypes,
  onFinished,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [lines, setLines] = useState<ImportLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  const reset = useCallback(() => {
    setFileName('');
    setLines([]);
    setProgress(0);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next && importing) {
      toast.error('匯入進行中，請稍候');
      return;
    }
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDownloadTemplate = () => {
    if (!parkingTypes.length) {
      toast.error('尚未載入停車場類型，請重新整理頁面');
      return;
    }
    downloadBookingImportTemplate(parkingTypes);
    toast.success('已下載範本');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setProgress(0);
    try {
      const buf = await file.arrayBuffer();
      const outcomes = parseBookingImportWorkbook(buf, parkingTypes);
      const next: ImportLine[] = outcomes.map((o) => {
        if (!o.ok) {
          return {
            sheetRow: o.sheetRow,
            summary: o.sheetRow > 0 ? `第 ${o.sheetRow} 列` : '檔案',
            status: 'parse_failed',
            detail: o.message,
          };
        }
        return {
          sheetRow: o.row.sheetRow,
          summary: `${o.row.driverName}（列 ${o.row.sheetRow}）`,
          status: 'pending',
          payload: o.row,
        };
      });
      setLines(next);
      const ok = next.filter((l) => l.status === 'pending').length;
      const bad = next.filter((l) => l.status === 'parse_failed').length;
      toast.success(`已解析：${ok} 筆可匯入，${bad} 筆格式錯誤`);
    } catch (err) {
      console.error(err);
      toast.error('無法讀取檔案');
      setLines([]);
    }
  };

  const runImport = async () => {
    const queue = lines
      .map((l, index) => ({ index, l }))
      .filter(({ l }) => l.status === 'pending' && l.payload);
    if (queue.length === 0) {
      toast.error('沒有可匯入的資料列');
      return;
    }

    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let step = 0; step < queue.length; step++) {
      const { index, l } = queue[step];
      const payload = l.payload!;

      setLines((prev) =>
        prev.map((row, i) => (i === index ? { ...row, status: 'validating', detail: '檢查空位與時段…' } : row))
      );

      try {
        const av = await checkAvailability({
          parkingTypeId: payload.parkingTypeId,
          checkInTime: startOfDayISO(payload.checkInTime),
          checkOutTime: endOfDayISO(payload.checkOutTime),
          vehicleCount: payload.vehicleCount,
        });

        if (!av.success) {
          const msg = av.message || '空位或時段檢查未通過';
          setLines((prev) =>
            prev.map((row, i) => (i === index ? { ...row, status: 'failed', detail: msg } : row))
          );
          failed++;
        } else {
          setLines((prev) =>
            prev.map((row, i) => (i === index ? { ...row, status: 'creating', detail: '建立預約…' } : row))
          );
          await createManualBooking(rowToManualBookingPayload(payload));
          setLines((prev) =>
            prev.map((row, i) =>
              i === index ? { ...row, status: 'success', detail: '匯入成功' } : row
            )
          );
          success++;
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        const msg = err.response?.data?.message || err.message || '建立失敗';
        setLines((prev) =>
          prev.map((row, i) => (i === index ? { ...row, status: 'failed', detail: msg } : row))
        );
        failed++;
      }

      setProgress(Math.round(((step + 1) / queue.length) * 100));
    }

    setImporting(false);
    if (success > 0) toast.success(`成功匯入 ${success} 筆`);
    if (failed > 0) toast.error(`${failed} 筆失敗，請查看下方明細`);
    onFinished?.();
  };

  const pendingCount = lines.filter((l) => l.status === 'pending').length;
  const parseFailedCount = lines.filter((l) => l.status === 'parse_failed').length;

  const statusIcon = (s: LineStatus) => {
    if (s === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    if (s === 'failed' || s === 'parse_failed') return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
    if (s === 'validating' || s === 'creating')
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            匯入預約
          </DialogTitle>
          <DialogDescription>
            下載範本填寫後上傳。系統會逐筆以與「手動預約」相同規則檢查空位、日期時段與維護日，並顯示每列結果。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5">
            <Download className="h-4 w-4" />
            下載 Excel 範本
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            選擇檔案
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {fileName && (
          <p className="text-xs text-muted-foreground truncate" title={fileName}>
            已選擇：{fileName}
          </p>
        )}

        {lines.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                共 {lines.length} 列 · 可匯入 {pendingCount} · 格式錯誤 {parseFailedCount}
              </span>
              {importing && <span>處理中…</span>}
            </div>
            <Progress
              value={importing || progress === 100 ? progress : 0}
              className={cn('h-2', importing && 'bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-emerald-500')}
            />
            <ScrollArea className="h-[min(320px,40vh)] rounded-md border bg-slate-50/80 p-2">
              <ul className="space-y-2 pr-3">
                {lines.map((line, idx) => (
                  <li
                    key={`${line.sheetRow}-${idx}`}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm transition-colors',
                      line.status === 'success' && 'border-emerald-200 bg-emerald-50/90',
                      line.status === 'failed' && 'border-red-200 bg-red-50/90',
                      line.status === 'parse_failed' && 'border-amber-200 bg-amber-50/80',
                      (line.status === 'pending' || line.status === 'validating' || line.status === 'creating') &&
                        'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {statusIcon(line.status)}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">{line.summary}</div>
                        {line.detail && (
                          <div
                            className={cn(
                              'text-xs mt-0.5 break-words',
                              line.status === 'success' && 'text-emerald-800',
                              (line.status === 'failed' || line.status === 'parse_failed') && 'text-red-800',
                              (line.status === 'validating' || line.status === 'creating') && 'text-blue-800'
                            )}
                          >
                            {line.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={importing}>
            關閉
          </Button>
          <Button
            type="button"
            onClick={runImport}
            disabled={importing || pendingCount === 0}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                匯入中…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                開始匯入（{pendingCount} 筆）
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
