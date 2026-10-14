import * as text from "../../../../kit/text.js";
import { PathRule } from "./path-rule.js";

/** How screens and exports show a path rule. */
export class PathRuleView {
  code: string;
  name: string;
  phone: string;
  bidText: string;
  channelText: string;
  locale: string;
  segmentText: string;
  reviewerText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    bidText: string,
    channelText: string,
    locale: string,
    segmentText: string,
    reviewerText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.bidText = bidText;
    this.channelText = channelText;
    this.locale = locale;
    this.segmentText = segmentText;
    this.reviewerText = reviewerText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toPathRuleView(item: PathRule): PathRuleView {
  return new PathRuleView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.phone,
    item.bid.toFixed(2),
    item.channel,
    item.locale,
    text.truncate(item.segment, 80),
    item.reviewer,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathRuleViews(items: PathRule[]): PathRuleView[] {
  const views: PathRuleView[] = [];
  for (const item of items) {
    views.push(toPathRuleView(item));
  }
  return views;
}

export function sumPathRuleView(view: PathRuleView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBid + parsedSendAt;
}
