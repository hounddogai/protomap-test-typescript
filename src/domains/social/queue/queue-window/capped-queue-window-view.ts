import * as text from "../../../../kit/text.js";
import { CappedQueueWindow } from "./capped-queue-window.js";

/** How screens and exports show a capped queue window. */
export class CappedQueueWindowView {
  code: string;
  name: string;
  rateText: string;
  graceDays: string;
  statusLabel: string;

  constructor(code: string, name: string, rateText: string, graceDays: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.rateText = rateText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toCappedQueueWindowView(item: CappedQueueWindow): CappedQueueWindowView {
  return new CappedQueueWindowView(
    text.truncate(item.code, 80),
    item.name,
    item.rate.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedQueueWindowViews(items: CappedQueueWindow[]): CappedQueueWindowView[] {
  const views: CappedQueueWindowView[] = [];
  for (const item of items) {
    views.push(toCappedQueueWindowView(item));
  }
  return views;
}

export function sumCappedQueueWindowView(view: CappedQueueWindowView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedRate + parsedGraceDays;
}
