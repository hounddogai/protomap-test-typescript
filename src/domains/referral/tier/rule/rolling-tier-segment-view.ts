import { RollingTierSegment } from "./rolling-tier-segment.js";

/** How screens and exports show a rolling tier segment. */
export class RollingTierSegmentView {
  code: string;
  label: string;
  ownerIdText: string;
  durationMinutes: string;
  rate: string;
  approved: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerIdText: string,
    durationMinutes: string,
    rate: string,
    approved: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.approved = approved;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toRollingTierSegmentView(item: RollingTierSegment): RollingTierSegmentView {
  return new RollingTierSegmentView(
    item.code,
    item.label,
    item.ownerId,
    String(item.durationMinutes),
    item.rate.toFixed(2),
    `${item.approved}`,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingTierSegmentViews(items: RollingTierSegment[]): RollingTierSegmentView[] {
  const views: RollingTierSegmentView[] = [];
  for (const item of items) {
    views.push(toRollingTierSegmentView(item));
  }
  return views;
}

export function sumRollingTierSegmentView(view: RollingTierSegmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedDurationMinutes + parsedRate + parsedPriority;
}
