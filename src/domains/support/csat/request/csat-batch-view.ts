import * as text from "../../../../kit/text.js";
import { CsatBatch } from "./csat-batch.js";

/** How screens and exports show a csat batch. */
export class CsatBatchView {
  code: string;
  name: string;
  durationMinutes: string;
  timezone: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    timezone: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toCsatBatchView(item: CsatBatch): CsatBatchView {
  return new CsatBatchView(
    item.code,
    item.name,
    String(item.durationMinutes),
    text.truncate(item.timezone, 120),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatBatchViews(items: CsatBatch[]): CsatBatchView[] {
  const views: CsatBatchView[] = [];
  for (const item of items) {
    views.push(toCsatBatchView(item));
  }
  return views;
}

export function sumCsatBatchView(view: CsatBatchView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedDurationMinutes + parsedClicks;
}
