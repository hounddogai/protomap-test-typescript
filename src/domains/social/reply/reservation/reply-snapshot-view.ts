import { ReplySnapshot } from "./reply-snapshot.js";

/** How screens and exports show a reply snapshot. */
export class ReplySnapshotView {
  code: string;
  title: string;
  windowDays: string;
  bidText: string;
  createdAt: string;
  durationMinutesText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    bidText: string,
    createdAt: string,
    durationMinutesText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.bidText = bidText;
    this.createdAt = createdAt;
    this.durationMinutesText = durationMinutesText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toReplySnapshotView(item: ReplySnapshot): ReplySnapshotView {
  return new ReplySnapshotView(
    item.code,
    item.title,
    String(item.windowDays),
    item.bid.toFixed(2),
    String(item.createdAt),
    String(item.durationMinutes),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplySnapshotViews(items: ReplySnapshot[]): ReplySnapshotView[] {
  const views: ReplySnapshotView[] = [];
  for (const item of items) {
    views.push(toReplySnapshotView(item));
  }
  return views;
}

export function sumReplySnapshotView(view: ReplySnapshotView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedWindowDays + parsedBid + parsedCreatedAt;
}
