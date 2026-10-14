import { ReplyThreshold } from "./reply-threshold.js";

/** How screens and exports show a reply threshold. */
export class ReplyThresholdView {
  code: string;
  name: string;
  utmSource: string;
  source: string;
  retries: string;
  openRateText: string;
  categoryText: string;
  locale: string;
  frequencyCap: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    source: string,
    retries: string,
    openRateText: string,
    categoryText: string,
    locale: string,
    frequencyCap: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.source = source;
    this.retries = retries;
    this.openRateText = openRateText;
    this.categoryText = categoryText;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toReplyThresholdView(item: ReplyThreshold): ReplyThresholdView {
  return new ReplyThresholdView(
    item.code,
    item.name,
    item.utmSource,
    item.source,
    String(item.retries),
    item.openRate.toFixed(2),
    item.category,
    item.locale,
    String(item.frequencyCap),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyThresholdViews(items: ReplyThreshold[]): ReplyThresholdView[] {
  const views: ReplyThresholdView[] = [];
  for (const item of items) {
    views.push(toReplyThresholdView(item));
  }
  return views;
}

export function sumReplyThresholdView(view: ReplyThresholdView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRetries + parsedOpenRate + parsedFrequencyCap;
}
