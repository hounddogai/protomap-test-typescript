import * as text from "../../../../kit/text.js";
import { DefaultStreakTarget } from "./default-streak-target.js";

/** How screens and exports show a default streak target. */
export class DefaultStreakTargetView {
  code: string;
  label: string;
  durationMinutes: string;
  utmSource: string;
  impressionsText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutes: string,
    utmSource: string,
    impressionsText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.impressionsText = impressionsText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultStreakTargetView(item: DefaultStreakTarget): DefaultStreakTargetView {
  return new DefaultStreakTargetView(
    item.code,
    item.label,
    String(item.durationMinutes),
    text.truncate(item.utmSource, 80),
    String(item.impressions),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultStreakTargetViews(items: DefaultStreakTarget[]): DefaultStreakTargetView[] {
  const views: DefaultStreakTargetView[] = [];
  for (const item of items) {
    views.push(toDefaultStreakTargetView(item));
  }
  return views;
}

export function sumDefaultStreakTargetView(view: DefaultStreakTargetView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDurationMinutes + parsedImpressions + parsedQuantity;
}
