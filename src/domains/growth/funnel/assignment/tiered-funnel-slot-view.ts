import * as text from "../../../../kit/text.js";
import { TieredFunnelSlot } from "./tiered-funnel-slot.js";

/** How screens and exports show a tiered funnel slot. */
export class TieredFunnelSlotView {
  code: string;
  title: string;
  retries: string;
  impressions: string;
  pinned: string;
  windowDays: string;
  openRateText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    impressions: string,
    pinned: string,
    windowDays: string,
    openRateText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.impressions = impressions;
    this.pinned = pinned;
    this.windowDays = windowDays;
    this.openRateText = openRateText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFunnelSlotView(item: TieredFunnelSlot): TieredFunnelSlotView {
  return new TieredFunnelSlotView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    String(item.retries),
    String(item.impressions),
    `${item.pinned}`,
    String(item.windowDays),
    item.openRate.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFunnelSlotViews(items: TieredFunnelSlot[]): TieredFunnelSlotView[] {
  const views: TieredFunnelSlotView[] = [];
  for (const item of items) {
    views.push(toTieredFunnelSlotView(item));
  }
  return views;
}

export function sumTieredFunnelSlotView(view: TieredFunnelSlotView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedRetries + parsedImpressions + parsedWindowDays;
}
