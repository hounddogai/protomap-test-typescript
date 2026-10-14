import { ManualTierSegment } from "./manual-tier-segment.js";

/** How screens and exports show a manual tier segment. */
export class ManualTierSegmentView {
  code: string;
  title: string;
  graceDays: string;
  capacityText: string;
  currency: string;
  createdAtText: string;
  priorityText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    capacityText: string,
    currency: string,
    createdAtText: string,
    priorityText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.capacityText = capacityText;
    this.currency = currency;
    this.createdAtText = createdAtText;
    this.priorityText = priorityText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierSegmentView(item: ManualTierSegment): ManualTierSegmentView {
  return new ManualTierSegmentView(
    item.code,
    item.title,
    String(item.graceDays),
    String(item.capacity),
    item.currency,
    String(item.createdAt),
    String(item.priority),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierSegmentViews(items: ManualTierSegment[]): ManualTierSegmentView[] {
  const views: ManualTierSegmentView[] = [];
  for (const item of items) {
    views.push(toManualTierSegmentView(item));
  }
  return views;
}

export function sumManualTierSegmentView(view: ManualTierSegmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedGraceDays + parsedCapacity + parsedCreatedAt;
}
