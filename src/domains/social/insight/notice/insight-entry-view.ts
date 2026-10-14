import { InsightEntry } from "./insight-entry.js";

/** How screens and exports show a insight entry. */
export class InsightEntryView {
  code: string;
  name: string;
  weight: string;
  approvedText: string;
  graceDays: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    weight: string,
    approvedText: string,
    graceDays: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.approvedText = approvedText;
    this.graceDays = graceDays;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toInsightEntryView(item: InsightEntry): InsightEntryView {
  return new InsightEntryView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    `${item.approved}`,
    String(item.graceDays),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightEntryViews(items: InsightEntry[]): InsightEntryView[] {
  const views: InsightEntryView[] = [];
  for (const item of items) {
    views.push(toInsightEntryView(item));
  }
  return views;
}

export function sumInsightEntryView(view: InsightEntryView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedWeight + parsedGraceDays;
}
