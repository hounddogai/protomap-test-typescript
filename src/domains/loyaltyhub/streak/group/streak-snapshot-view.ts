import * as text from "../../../../kit/text.js";
import { StreakSnapshot } from "./streak-snapshot.js";

/** How screens and exports show a streak snapshot. */
export class StreakSnapshotView {
  code: string;
  title: string;
  ceiling: string;
  bid: string;
  channelText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceiling: string,
    bid: string,
    channelText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.bid = bid;
    this.channelText = channelText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakSnapshotView(item: StreakSnapshot): StreakSnapshotView {
  return new StreakSnapshotView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.channel, 120),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakSnapshotViews(items: StreakSnapshot[]): StreakSnapshotView[] {
  const views: StreakSnapshotView[] = [];
  for (const item of items) {
    views.push(toStreakSnapshotView(item));
  }
  return views;
}

export function sumStreakSnapshotView(view: StreakSnapshotView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedCeiling + parsedBid;
}
