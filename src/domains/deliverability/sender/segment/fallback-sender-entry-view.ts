import * as text from "../../../../kit/text.js";
import { FallbackSenderEntry } from "./fallback-sender-entry.js";

/** How screens and exports show a fallback sender entry. */
export class FallbackSenderEntryView {
  code: string;
  label: string;
  channel: string;
  bidText: string;
  startsAt: string;
  locale: string;
  revision: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    bidText: string,
    startsAt: string,
    locale: string,
    revision: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.bidText = bidText;
    this.startsAt = startsAt;
    this.locale = locale;
    this.revision = revision;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderEntryView(item: FallbackSenderEntry): FallbackSenderEntryView {
  return new FallbackSenderEntryView(
    item.code,
    text.truncate(item.label, 120),
    item.channel,
    item.bid.toFixed(2),
    String(item.startsAt),
    item.locale,
    String(item.revision),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderEntryViews(items: FallbackSenderEntry[]): FallbackSenderEntryView[] {
  const views: FallbackSenderEntryView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderEntryView(item));
  }
  return views;
}

export function sumFallbackSenderEntryView(view: FallbackSenderEntryView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBid + parsedStartsAt + parsedRevision;
}
