import * as text from "../../../../kit/text.js";
import { PendingFrequencyCycle } from "./pending-frequency-cycle.js";

/** How screens and exports show a pending frequency cycle. */
export class PendingFrequencyCycleView {
  code: string;
  title: string;
  rate: string;
  country: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    rate: string,
    country: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.country = country;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFrequencyCycleView(item: PendingFrequencyCycle): PendingFrequencyCycleView {
  return new PendingFrequencyCycleView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    text.truncate(item.country, 80),
    text.truncate(item.segment, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFrequencyCycleViews(items: PendingFrequencyCycle[]): PendingFrequencyCycleView[] {
  const views: PendingFrequencyCycleView[] = [];
  for (const item of items) {
    views.push(toPendingFrequencyCycleView(item));
  }
  return views;
}

export function sumPendingFrequencyCycleView(view: PendingFrequencyCycleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
