import * as text from "../../../../kit/text.js";
import { ReplyVariance } from "./reply-variance.js";

/** How screens and exports show a reply variance. */
export class ReplyVarianceView {
  code: string;
  name: string;
  bidText: string;
  priority: string;
  endsAt: string;
  cohort: string;
  ownerId: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bidText: string,
    priority: string,
    endsAt: string,
    cohort: string,
    ownerId: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bidText = bidText;
    this.priority = priority;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toReplyVarianceView(item: ReplyVariance): ReplyVarianceView {
  return new ReplyVarianceView(
    item.code,
    text.truncate(item.name, 40),
    item.bid.toFixed(2),
    String(item.priority),
    String(item.endsAt),
    item.cohort,
    item.ownerId,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyVarianceViews(items: ReplyVariance[]): ReplyVarianceView[] {
  const views: ReplyVarianceView[] = [];
  for (const item of items) {
    views.push(toReplyVarianceView(item));
  }
  return views;
}

export function sumReplyVarianceView(view: ReplyVarianceView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedBid + parsedPriority + parsedEndsAt;
}
