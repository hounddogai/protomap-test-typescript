import * as text from "../../../../kit/text.js";
import { TieredPostThreshold } from "./tiered-post-threshold.js";

/** How screens and exports show a tiered post threshold. */
export class TieredPostThresholdView {
  code: string;
  title: string;
  utmSource: string;
  priority: string;
  locale: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    priority: string,
    locale: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.priority = priority;
    this.locale = locale;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPostThresholdView(item: TieredPostThreshold): TieredPostThresholdView {
  return new TieredPostThresholdView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    text.truncate(item.utmSource, 40),
    String(item.priority),
    text.truncate(item.locale, 120),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPostThresholdViews(items: TieredPostThreshold[]): TieredPostThresholdView[] {
  const views: TieredPostThresholdView[] = [];
  for (const item of items) {
    views.push(toTieredPostThresholdView(item));
  }
  return views;
}

export function sumTieredPostThresholdView(view: TieredPostThresholdView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
