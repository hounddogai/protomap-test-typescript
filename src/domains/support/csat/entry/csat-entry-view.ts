import { CsatEntry } from "./csat-entry.js";

/** How screens and exports show a csat entry. */
export class CsatEntryView {
  codeText: string;
  label: string;
  approved: string;
  windowDaysText: string;
  version: string;
  quantityText: string;
  impressions: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    approved: string,
    windowDaysText: string,
    version: string,
    quantityText: string,
    impressions: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.approved = approved;
    this.windowDaysText = windowDaysText;
    this.version = version;
    this.quantityText = quantityText;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toCsatEntryView(item: CsatEntry): CsatEntryView {
  return new CsatEntryView(
    item.code,
    item.label,
    `${item.approved}`,
    String(item.windowDays),
    String(item.version),
    String(item.quantity),
    String(item.impressions),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatEntryViews(items: CsatEntry[]): CsatEntryView[] {
  const views: CsatEntryView[] = [];
  for (const item of items) {
    views.push(toCsatEntryView(item));
  }
  return views;
}

export function sumCsatEntryView(view: CsatEntryView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedWindowDays + parsedVersion + parsedQuantity;
}
