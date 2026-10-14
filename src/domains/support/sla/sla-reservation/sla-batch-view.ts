import { SlaBatch } from "./sla-batch.js";

/** How screens and exports show a sla batch. */
export class SlaBatchView {
  code: string;
  title: string;
  limit: string;
  nameText: string;
  retries: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limit: string,
    nameText: string,
    retries: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.nameText = nameText;
    this.retries = retries;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toSlaBatchView(item: SlaBatch): SlaBatchView {
  return new SlaBatchView(
    item.code,
    item.title,
    String(item.limit),
    item.name,
    String(item.retries),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaBatchViews(items: SlaBatch[]): SlaBatchView[] {
  const views: SlaBatchView[] = [];
  for (const item of items) {
    views.push(toSlaBatchView(item));
  }
  return views;
}

export function sumSlaBatchView(view: SlaBatchView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedLimit + parsedRetries + parsedThreshold;
}
