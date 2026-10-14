import * as text from "../../../../kit/text.js";
import { FallbackCreditNotice } from "./fallback-credit-notice.js";

/** How screens and exports show a fallback credit notice. */
export class FallbackCreditNoticeView {
  code: string;
  name: string;
  bid: string;
  durationMinutes: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    durationMinutes: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditNoticeView(item: FallbackCreditNotice): FallbackCreditNoticeView {
  return new FallbackCreditNoticeView(
    text.truncate(item.code, 120),
    item.name,
    item.bid.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditNoticeViews(items: FallbackCreditNotice[]): FallbackCreditNoticeView[] {
  const views: FallbackCreditNoticeView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditNoticeView(item));
  }
  return views;
}

export function sumFallbackCreditNoticeView(view: FallbackCreditNoticeView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBid + parsedDurationMinutes;
}
