import * as text from "../../../../kit/text.js";
import { CappedMentionBaseline } from "./capped-mention-baseline.js";

/** How screens and exports show a capped mention baseline. */
export class CappedMentionBaselineView {
  code: string;
  title: string;
  expiresAtText: string;
  openRate: string;
  channelText: string;
  limit: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAtText: string,
    openRate: string,
    channelText: string,
    limit: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.openRate = openRate;
    this.channelText = channelText;
    this.limit = limit;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMentionBaselineView(item: CappedMentionBaseline): CappedMentionBaselineView {
  return new CappedMentionBaselineView(
    item.code,
    text.truncate(item.title, 120),
    String(item.expiresAt),
    item.openRate.toFixed(2),
    item.channel,
    String(item.limit),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMentionBaselineViews(items: CappedMentionBaseline[]): CappedMentionBaselineView[] {
  const views: CappedMentionBaselineView[] = [];
  for (const item of items) {
    views.push(toCappedMentionBaselineView(item));
  }
  return views;
}

export function sumCappedMentionBaselineView(view: CappedMentionBaselineView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedExpiresAt + parsedOpenRate + parsedLimit;
}
