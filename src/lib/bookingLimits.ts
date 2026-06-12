export const PASSENGERS_PER_VEHICLE = 5;

export function getPassengerLimit(vehicleCount?: number | string | null): number {
  const parsed = Number.parseInt(String(vehicleCount ?? 1), 10);
  const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return count * PASSENGERS_PER_VEHICLE;
}

export function clampPassengerCount(
  value: number | string | null | undefined,
  vehicleCount?: number | string | null
): number {
  const parsed = Number.parseInt(String(value ?? 0), 10);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  return Math.min(normalized, getPassengerLimit(vehicleCount));
}
