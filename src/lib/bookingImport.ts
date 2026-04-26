import * as XLSX from 'xlsx';
import { fromDateTimeLocal, toDateInput, getTaiwanHourMinute, getDateStrTaiwan, getNextDayStrTaiwan } from '@/lib/dateUtils';

export const IMPORT_SHEET_DATA = '預約資料';
export const IMPORT_SHEET_TYPES = '停車場類型';
export const IMPORT_SHEET_README = '填寫說明';

const BOM = /^\uFEFF/;

function sk(s: string): string {
  return s.replace(BOM, '').trim();
}

/** Map header cell text → canonical field name */
function resolveFieldName(raw: string): string | null {
  const t = sk(raw);
  if (!t) return null;
  const lower = t.toLowerCase().replace(/\s+/g, '');
  const noSpace = t.replace(/\s/g, '');

  const map: Record<string, string> = {
    parkingtypeid: 'parkingTypeId',
    parking_type_id: 'parkingTypeId',
    停車類型id: 'parkingTypeId',
    停车场类型id: 'parkingTypeId',
    parkingtypename: 'parkingTypeName',
    停車場名稱: 'parkingTypeName',
    停車類型名稱: 'parkingTypeName',
    停车场名称: 'parkingTypeName',
    typename: 'parkingTypeName',
    checkintime: 'checkInTime',
    checkin: 'checkInTime',
    進場時間: 'checkInTime',
    进场时间: 'checkInTime',
    入場時間: 'checkInTime',
    checkouttime: 'checkOutTime',
    checkout: 'checkOutTime',
    離場時間: 'checkOutTime',
    离场时间: 'checkOutTime',
    出場時間: 'checkOutTime',
    drivername: 'driverName',
    姓名: 'driverName',
    客戶姓名: 'driverName',
    客户姓名: 'driverName',
    phone: 'phone',
    電話: 'phone',
    电话: 'phone',
    mobile: 'phone',
    licenseplate: 'licensePlate',
    車牌: 'licensePlate',
    车牌: 'licensePlate',
    plate: 'licensePlate',
    email: 'email',
    信箱: 'email',
    郵件: 'email',
    vehiclecount: 'vehicleCount',
    車輛數: 'vehicleCount',
    车辆数: 'vehicleCount',
    車位數: 'vehicleCount',
    discountcode: 'discountCode',
    折扣碼: 'discountCode',
    折扣码: 'discountCode',
    notes: 'notes',
    備註: 'notes',
    备注: 'notes',
    flightnumber: 'flightNumber',
    航班編號: 'flightNumber',
    航班编号: 'flightNumber',
    isvip: 'isVIP',
    vip: 'isVIP',
    貴賓: 'isVIP',
    贵宾: 'isVIP',
  };

  if (map[lower]) return map[lower];
  if (map[noSpace]) return map[noSpace];
  if (map[t]) return map[t];
  return null;
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const ms = utcDays * 86400 * 1000;
  const d = new Date(ms);
  const frac = serial % 1;
  if (frac > 0) {
    const totalSeconds = Math.round(86400 * frac);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCSeconds(d.getUTCSeconds() + totalSeconds);
  }
  return d;
}

/** Convert Excel / string / Date to Taiwan-offset ISO used by manual booking */
export function cellToCheckIso(cell: unknown): string | null {
  if (cell === null || cell === undefined || cell === '') return null;

  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) return null;
    const day = toDateInput(cell);
    const { hours, minutes } = getTaiwanHourMinute(cell);
    return fromDateTimeLocal(`${day}T${hours}:${minutes}`);
  }

  if (typeof cell === 'number' && !Number.isNaN(cell)) {
    const d = excelSerialToDate(cell);
    if (Number.isNaN(d.getTime())) return null;
    const day = toDateInput(d);
    const { hours, minutes } = getTaiwanHourMinute(d);
    return fromDateTimeLocal(`${day}T${hours}:${minutes}`);
  }

  if (typeof cell === 'string') {
    const s = sk(cell);
    if (!s) return null;

    if (/^\d{4}-\d{2}-\d{2}T/.test(s) || /^\d{4}-\d{2}-\d{2}\+\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      const day = toDateInput(d);
      const { hours, minutes } = getTaiwanHourMinute(d);
      return fromDateTimeLocal(`${day}T${hours}:${minutes}`);
    }

    const m = s.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, '0');
      const da = m[3].padStart(2, '0');
      const hh = (m[4] ?? '0').padStart(2, '0');
      const mm = (m[5] ?? '00').padStart(2, '0');
      return fromDateTimeLocal(`${y}-${mo}-${da}T${hh}:${mm}`);
    }
  }

  return null;
}

export function parseBoolCell(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === 'number' && v === 1) return true;
  if (typeof v === 'string') {
    const s = sk(v).toLowerCase();
    return s === '1' || s === 'y' || s === 'yes' || s === 'true' || s === '是' || s === 'vip';
  }
  return false;
}

/** Default 1 when blank; null if non-numeric or &lt; 1 */
export function parseVehicleCount(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return 1;
  const n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

export interface ParkingTypeRef {
  _id: string;
  name: string;
  totalSpaces?: number;
}

export interface ImportRowParsed {
  sheetRow: number;
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  driverName: string;
  phone: string;
  licensePlate: string;
  email: string;
  vehicleCount: number;
  discountCode: string;
  flightNumber: string;
  notes: string;
  isVIP: boolean;
}

export type ImportRowOutcome =
  | { ok: true; row: ImportRowParsed }
  | { ok: false; sheetRow: number; message: string };

function resolveParkingTypeId(
  row: Record<string, unknown>,
  parkingTypes: ParkingTypeRef[]
): { id: string | null; error?: string } {
  const idRaw = row.parkingTypeId != null && row.parkingTypeId !== '' ? String(row.parkingTypeId).trim() : '';
  const nameRaw =
    row.parkingTypeName != null && row.parkingTypeName !== '' ? String(row.parkingTypeName).trim() : '';

  if (idRaw && /^[a-f\d]{24}$/i.test(idRaw)) {
    const exists = parkingTypes.some((p) => p._id === idRaw);
    if (!exists) return { id: null, error: '停車類型 ID 不存在於系統' };
    return { id: idRaw };
  }

  if (nameRaw) {
    const lower = nameRaw.toLowerCase();
    const hit = parkingTypes.find((p) => p.name.trim().toLowerCase() === lower);
    if (hit) return { id: hit._id };
    const partial = parkingTypes.find((p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase()));
    if (partial) return { id: partial._id };
    return { id: null, error: '找不到對應的停車場名稱' };
  }

  if (idRaw) return { id: null, error: '停車類型 ID 格式錯誤（須為 24 字元）' };

  return { id: null, error: '請填停車類型 ID 或停車場名稱' };
}

/** Build one row from mapped object; sheetRow = Excel 1-based row index */
export function validateAndBuildRow(
  sheetRow: number,
  mapped: Record<string, unknown>,
  parkingTypes: ParkingTypeRef[]
): ImportRowOutcome {
  const { id: parkingTypeId, error: ptError } = resolveParkingTypeId(mapped, parkingTypes);
  if (!parkingTypeId) {
    return { ok: false, sheetRow, message: ptError || '停車類型錯誤' };
  }

  const checkInTime = cellToCheckIso(mapped.checkInTime);
  const checkOutTime = cellToCheckIso(mapped.checkOutTime);
  if (!checkInTime) {
    return { ok: false, sheetRow, message: '進場時間格式錯誤或空白（請用 YYYY-MM-DD HH:mm）' };
  }
  if (!checkOutTime) {
    return { ok: false, sheetRow, message: '離場時間格式錯誤或空白（請用 YYYY-MM-DD HH:mm）' };
  }

  const cin = new Date(checkInTime);
  const cout = new Date(checkOutTime);
  if (cout <= cin) {
    return { ok: false, sheetRow, message: '離場時間須晚於進場時間' };
  }

  const driverName = mapped.driverName != null ? String(mapped.driverName).trim() : '';
  const phone = mapped.phone != null ? String(mapped.phone).trim() : '';
  const licensePlate = mapped.licensePlate != null ? String(mapped.licensePlate).trim() : '';
  if (!driverName) return { ok: false, sheetRow, message: '姓名為必填' };
  if (!phone) return { ok: false, sheetRow, message: '電話為必填' };
  if (!licensePlate) return { ok: false, sheetRow, message: '車牌為必填' };

  const pt = parkingTypes.find((p) => p._id === parkingTypeId);
  const vehicleCount = parseVehicleCount(mapped.vehicleCount);
  if (vehicleCount === null) {
    return { ok: false, sheetRow, message: '車輛數須為正整數' };
  }
  if (pt?.totalSpaces != null && vehicleCount > pt.totalSpaces) {
    return {
      ok: false,
      sheetRow,
      message: `車輛數不可超過該停車場總車位（${pt.totalSpaces}）`,
    };
  }

  const email = mapped.email != null ? String(mapped.email).trim() : '';
  const discountCode = mapped.discountCode != null ? String(mapped.discountCode).trim() : '';
  const flightNumber = mapped.flightNumber != null ? String(mapped.flightNumber).trim() : '';
  const notes = mapped.notes != null ? String(mapped.notes).trim() : '';
  const isVIP = parseBoolCell(mapped.isVIP);

  return {
    ok: true,
    row: {
      sheetRow,
      parkingTypeId,
      checkInTime,
      checkOutTime,
      driverName,
      phone,
      licensePlate,
      email,
      vehicleCount,
      discountCode,
      flightNumber,
      notes,
      isVIP,
    },
  };
}

/** Parse first data sheet: prefer sheet named 預約資料, else first sheet */
export function parseBookingImportWorkbook(
  buffer: ArrayBuffer,
  parkingTypes: ParkingTypeRef[]
): ImportRowOutcome[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n === IMPORT_SHEET_DATA) ?? wb.SheetNames[0];
  if (!sheetName) {
    return [{ ok: false, sheetRow: 0, message: '檔案中沒有工作表' }];
  }
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
  }) as unknown[][];

  if (!aoa.length) {
    return [{ ok: false, sheetRow: 0, message: '工作表為空' }];
  }

  const headerCells = (aoa[0] || []).map((c) => (c == null ? '' : String(c)));
  const fieldByCol: (string | null)[] = headerCells.map((h) => resolveFieldName(h));

  if (!fieldByCol.some(Boolean)) {
    return [{ ok: false, sheetRow: 1, message: '第一列需為欄位標題（請使用下載的範本）' }];
  }

  const outcomes: ImportRowOutcome[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const excelRow = i + 1;
    const line = aoa[i] || [];
    const mapped: Record<string, unknown> = {};
    for (let c = 0; c < fieldByCol.length; c++) {
      const field = fieldByCol[c];
      if (!field) continue;
      const v = line[c];
      if (v !== '' && v !== null && v !== undefined) mapped[field] = v;
    }

    const hasAny =
      mapped.parkingTypeId ||
      mapped.parkingTypeName ||
      mapped.checkInTime ||
      mapped.checkOutTime ||
      mapped.driverName ||
      mapped.phone ||
      mapped.licensePlate;
    if (!hasAny) continue;

    outcomes.push(validateAndBuildRow(excelRow, mapped, parkingTypes));
  }

  if (outcomes.length === 0) {
    return [{ ok: false, sheetRow: 0, message: '沒有可匯入的資料列（略過空白列後為空）' }];
  }

  return outcomes;
}

export function downloadBookingImportTemplate(parkingTypes: ParkingTypeRef[]): void {
  const wb = XLSX.utils.book_new();
  const sampleId = parkingTypes[0]?._id ?? '';

  const headers = [
    'parkingTypeId',
    'checkInTime',
    'checkOutTime',
    'driverName',
    'phone',
    'licensePlate',
    'email',
    'vehicleCount',
    'discountCode',
    'flightNumber',
    'notes',
    'isVIP',
  ];

  const now = new Date();
  const d0 = getDateStrTaiwan(now);
  const d1 = getNextDayStrTaiwan(getNextDayStrTaiwan(d0));

  const example = [
    sampleId,
    `${d0} 08:00`,
    `${d1} 18:00`,
    '範例姓名',
    '0912345678',
    'ABC1234',
    '',
    1,
    '',
    '',
    '',
    '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws, IMPORT_SHEET_DATA);

  const refRows = [['_id', 'name', 'totalSpaces'], ...parkingTypes.map((p) => [p._id, p.name, p.totalSpaces ?? ''])];
  const wsTypes = XLSX.utils.aoa_to_sheet(refRows);
  wsTypes['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTypes, IMPORT_SHEET_TYPES);

  const readme = [
    ['填寫說明（請勿刪除「預約資料」第一列標題）'],
    [''],
    ['parkingTypeId', '必填。請自「停車場類型」分頁複製 _id；也可改用欄位 parkingTypeName（停車場名稱）'],
    ['checkInTime', '必填。格式：YYYY-MM-DD HH:mm（台灣時間）'],
    ['checkOutTime', '必填。格式同上；須晚於進場時間'],
    ['driverName / phone / licensePlate', '必填'],
    ['vehicleCount', '選填，預設 1；不可超過該停車場 totalSpaces'],
    ['isVIP', '選填：1 / 0、是 / 否、true / false'],
    [''],
    ['匯入時系統會逐筆檢查空位（與手動預約相同邏輯），含維護日與過去時間等限制。'],
  ];
  const wsReadme = XLSX.utils.aoa_to_sheet(readme);
  XLSX.utils.book_append_sheet(wb, wsReadme, IMPORT_SHEET_README);

  const stamp = d0.replace(/-/g, '');
  XLSX.writeFile(wb, `booking_import_template_${stamp}.xlsx`);
}

export function rowToManualBookingPayload(row: ImportRowParsed, vipDiscountDefault = 12) {
  return {
    parkingTypeId: row.parkingTypeId,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    driverName: row.driverName,
    phone: row.phone,
    email: row.email || undefined,
    licensePlate: row.licensePlate,
    vehicleCount: row.vehicleCount,
    passengerCount: 1,
    luggageCount: 0,
    departurePassengerCount: 1,
    departureLuggageCount: 0,
    returnPassengerCount: 1,
    returnLuggageCount: 0,
    addonServices: [] as string[],
    discountCode: row.discountCode || undefined,
    estimatedArrivalTime: undefined,
    flightNumber: row.flightNumber || undefined,
    notes: row.notes || undefined,
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    status: 'confirmed',
    departureTerminal: undefined,
    returnTerminal: undefined,
    isVIP: row.isVIP,
    vipDiscount: vipDiscountDefault,
  };
}
