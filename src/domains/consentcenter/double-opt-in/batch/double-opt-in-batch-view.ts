import * as text from "../../../../kit/text.js";
import { DoubleOptInBatch } from "./double-opt-in-batch.js";

/** How screens and exports show a double opt in batch. */
export class DoubleOptInBatchView {
  code: string;
  title: string;
  endsAt: string;
  marginText: string;
  name: string;
  timezone: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    marginText: string,
    name: string,
    timezone: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.marginText = marginText;
    this.name = name;
    this.timezone = timezone;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInBatchView(item: DoubleOptInBatch): DoubleOptInBatchView {
  return new DoubleOptInBatchView(
    item.code,
    text.truncate(item.title, 80),
    String(item.endsAt),
    item.margin.toFixed(2),
    item.name,
    item.timezone,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInBatchViews(items: DoubleOptInBatch[]): DoubleOptInBatchView[] {
  const views: DoubleOptInBatchView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInBatchView(item));
  }
  return views;
}

export function sumDoubleOptInBatchView(view: DoubleOptInBatchView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedEndsAt + parsedMargin + parsedCeiling;
}
