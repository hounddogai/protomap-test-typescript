import * as text from "../../../../kit/text.js";
import { InviteNotice } from "./invite-notice.js";

/** How screens and exports show a invite notice. */
export class InviteNoticeView {
  codeText: string;
  label: string;
  priority: string;
  threshold: string;
  summaryText: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    threshold: string,
    summaryText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.threshold = threshold;
    this.summaryText = summaryText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toInviteNoticeView(item: InviteNotice): InviteNoticeView {
  return new InviteNoticeView(
    item.code,
    text.truncate(item.label, 40),
    String(item.priority),
    item.threshold.toFixed(2),
    text.truncate(item.summary, 40),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteNoticeViews(items: InviteNotice[]): InviteNoticeView[] {
  const views: InviteNoticeView[] = [];
  for (const item of items) {
    views.push(toInviteNoticeView(item));
  }
  return views;
}

export function sumInviteNoticeView(view: InviteNoticeView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedPriority + parsedThreshold + parsedBid;
}
