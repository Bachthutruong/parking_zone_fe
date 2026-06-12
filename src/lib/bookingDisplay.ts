import type { Booking } from '@/types';

export type TerminalCode = 'terminal1' | 'terminal2';

export interface ShuttleInfoLike {
  departureTerminal?: string | null;
  returnTerminal?: string | null;
  departurePassengerCount?: number | null;
  departureLuggageCount?: number | null;
  returnPassengerCount?: number | null;
  returnLuggageCount?: number | null;
  passengerCount?: number | null;
  luggageCount?: number | null;
}

export function normalizeTerminal(value?: string | null): TerminalCode | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const compact = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (['terminal1', 'term1', 't1', '1'].includes(compact) || raw.includes('一航') || raw.includes('第一')) {
    return 'terminal1';
  }
  if (['terminal2', 'term2', 't2', '2'].includes(compact) || raw.includes('二航') || raw.includes('第二')) {
    return 'terminal2';
  }
  return null;
}

export function getTerminalLabel(
  value?: string | null,
  options: { style?: 'short' | 'full'; emptyLabel?: string } = {}
): string {
  const { style = 'full', emptyLabel = '未選擇' } = options;
  const terminal = normalizeTerminal(value);
  if (terminal === 'terminal1') return style === 'short' ? 'T1' : '第一航廈';
  if (terminal === 'terminal2') return style === 'short' ? 'T2' : '第二航廈';
  return emptyLabel;
}

export function getDeparturePassengerCount(booking: ShuttleInfoLike | Booking): number {
  return booking.departurePassengerCount ?? booking.passengerCount ?? 0;
}

export function getReturnPassengerCount(booking: ShuttleInfoLike | Booking): number {
  return booking.returnPassengerCount ?? 0;
}

export function getDepartureLuggageCount(booking: ShuttleInfoLike | Booking): number {
  return booking.departureLuggageCount ?? booking.luggageCount ?? 0;
}

export function getReturnLuggageCount(booking: ShuttleInfoLike | Booking): number {
  return booking.returnLuggageCount ?? 0;
}

export function formatTerminalPassenger(
  booking: ShuttleInfoLike | Booking,
  direction: 'departure' | 'return',
  options: { terminalStyle?: 'short' | 'full'; emptyLabel?: string } = {}
): string {
  const terminal = direction === 'departure' ? booking.departureTerminal : booking.returnTerminal;
  const passengerCount =
    direction === 'departure' ? getDeparturePassengerCount(booking) : getReturnPassengerCount(booking);
  return `${getTerminalLabel(terminal, {
    style: options.terminalStyle,
    emptyLabel: options.emptyLabel,
  })}(${passengerCount}人)`;
}
