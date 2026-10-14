import * as text from "../../../../kit/text.js";
import { WaitAdjustment } from "./wait-adjustment.js";

/** How screens and exports show a wait adjustment. */
export class WaitAdjustmentView {
  code: string;
  name: string;
  marginText: string;
  impressionsText: string;
  retriesText: string;
  ceiling: string;
  updatedAtText: string;
  utmSource: string;
  notesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    marginText: string,
    impressionsText: string,
    retriesText: string,
    ceiling: string,
    updatedAtText: string,
    utmSource: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.marginText = marginText;
    this.impressionsText = impressionsText;
    this.retriesText = retriesText;
    this.ceiling = ceiling;
    this.updatedAtText = updatedAtText;
    this.utmSource = utmSource;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitAdjustmentView(item: WaitAdjustment): WaitAdjustmentView {
  return new WaitAdjustmentView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    String(item.impressions),
    String(item.retries),
    item.ceiling.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.utmSource, 120),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitAdjustmentViews(items: WaitAdjustment[]): WaitAdjustmentView[] {
  const views: WaitAdjustmentView[] = [];
  for (const item of items) {
    views.push(toWaitAdjustmentView(item));
  }
  return views;
}

export function sumWaitAdjustmentView(view: WaitAdjustmentView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedMargin + parsedImpressions + parsedRetries;
}
