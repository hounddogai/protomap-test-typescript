import { BounceOverride } from "./bounce-override.js";

/** How screens and exports show a bounce override. */
export class BounceOverrideView {
  code: string;
  title: string;
  channel: string;
  name: string;
  threshold: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    name: string,
    threshold: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.name = name;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toBounceOverrideView(item: BounceOverride): BounceOverrideView {
  return new BounceOverrideView(
    item.code,
    item.title,
    item.channel,
    item.name,
    item.threshold.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceOverrideViews(items: BounceOverride[]): BounceOverrideView[] {
  const views: BounceOverrideView[] = [];
  for (const item of items) {
    views.push(toBounceOverrideView(item));
  }
  return views;
}

export function sumBounceOverrideView(view: BounceOverrideView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedThreshold + parsedGraceDays;
}
