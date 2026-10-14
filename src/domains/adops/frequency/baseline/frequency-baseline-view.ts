import { FrequencyBaseline } from "./frequency-baseline.js";

/** How screens and exports show a frequency baseline. */
export class FrequencyBaselineView {
  code: string;
  name: string;
  approved: string;
  graceDays: string;
  maximumText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approved: string,
    graceDays: string,
    maximumText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.graceDays = graceDays;
    this.maximumText = maximumText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyBaselineView(item: FrequencyBaseline): FrequencyBaselineView {
  return new FrequencyBaselineView(
    item.code,
    item.name,
    `${item.approved}`,
    String(item.graceDays),
    item.maximum.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyBaselineViews(items: FrequencyBaseline[]): FrequencyBaselineView[] {
  const views: FrequencyBaselineView[] = [];
  for (const item of items) {
    views.push(toFrequencyBaselineView(item));
  }
  return views;
}

export function sumFrequencyBaselineView(view: FrequencyBaselineView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedGraceDays + parsedMaximum + parsedRetries;
}
