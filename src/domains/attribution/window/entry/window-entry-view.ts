import { WindowEntry } from "./window-entry.js";

/** How screens and exports show a window entry. */
export class WindowEntryView {
  codeText: string;
  name: string;
  durationMinutes: string;
  region: string;
  threshold: string;
  quantity: string;
  utmSource: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    durationMinutes: string,
    region: string,
    threshold: string,
    quantity: string,
    utmSource: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.threshold = threshold;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWindowEntryView(item: WindowEntry): WindowEntryView {
  return new WindowEntryView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.region,
    item.threshold.toFixed(2),
    String(item.quantity),
    item.utmSource,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowEntryViews(items: WindowEntry[]): WindowEntryView[] {
  const views: WindowEntryView[] = [];
  for (const item of items) {
    views.push(toWindowEntryView(item));
  }
  return views;
}

export function sumWindowEntryView(view: WindowEntryView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDurationMinutes + parsedThreshold + parsedQuantity;
}
