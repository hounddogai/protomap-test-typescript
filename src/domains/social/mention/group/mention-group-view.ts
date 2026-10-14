import * as text from "../../../../kit/text.js";
import { MentionGroup } from "./mention-group.js";

/** How screens and exports show a mention group. */
export class MentionGroupView {
  code: string;
  titleText: string;
  pinned: string;
  label: string;
  graceDays: string;
  locale: string;
  margin: string;
  segment: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    label: string,
    graceDays: string,
    locale: string,
    margin: string,
    segment: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.label = label;
    this.graceDays = graceDays;
    this.locale = locale;
    this.margin = margin;
    this.segment = segment;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toMentionGroupView(item: MentionGroup): MentionGroupView {
  return new MentionGroupView(
    item.code,
    item.title,
    `${item.pinned}`,
    item.label,
    String(item.graceDays),
    text.truncate(item.locale, 40),
    item.margin.toFixed(2),
    item.segment,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionGroupViews(items: MentionGroup[]): MentionGroupView[] {
  const views: MentionGroupView[] = [];
  for (const item of items) {
    views.push(toMentionGroupView(item));
  }
  return views;
}

export function sumMentionGroupView(view: MentionGroupView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedGraceDays + parsedMargin + parsedBid;
}
