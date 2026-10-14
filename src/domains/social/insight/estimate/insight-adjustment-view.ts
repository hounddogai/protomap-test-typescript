import { InsightAdjustment } from "./insight-adjustment.js";

/** How screens and exports show a insight adjustment. */
export class InsightAdjustmentView {
  code: string;
  title: string;
  minimumText: string;
  threshold: string;
  notes: string;
  phone: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimumText: string,
    threshold: string,
    notes: string,
    phone: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimumText = minimumText;
    this.threshold = threshold;
    this.notes = notes;
    this.phone = phone;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toInsightAdjustmentView(item: InsightAdjustment): InsightAdjustmentView {
  return new InsightAdjustmentView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    item.threshold.toFixed(2),
    item.notes,
    item.phone,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightAdjustmentViews(items: InsightAdjustment[]): InsightAdjustmentView[] {
  const views: InsightAdjustmentView[] = [];
  for (const item of items) {
    views.push(toInsightAdjustmentView(item));
  }
  return views;
}

export function sumInsightAdjustmentView(view: InsightAdjustmentView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedMinimum + parsedThreshold;
}
