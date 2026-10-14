import * as text from "../../../../kit/text.js";
import { LeaderboardBatch } from "./leaderboard-batch.js";

/** How screens and exports show a leaderboard batch. */
export class LeaderboardBatchView {
  codeText: string;
  name: string;
  batchSize: string;
  bid: string;
  title: string;
  impressionsText: string;
  endsAt: string;
  externalRef: string;
  contactEmail: string;
  sequence: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    batchSize: string,
    bid: string,
    title: string,
    impressionsText: string,
    endsAt: string,
    externalRef: string,
    contactEmail: string,
    sequence: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.batchSize = batchSize;
    this.bid = bid;
    this.title = title;
    this.impressionsText = impressionsText;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardBatchView(item: LeaderboardBatch): LeaderboardBatchView {
  return new LeaderboardBatchView(
    text.truncate(item.code, 64),
    item.name,
    String(item.batchSize),
    item.bid.toFixed(2),
    text.truncate(item.title, 64),
    String(item.impressions),
    String(item.endsAt),
    item.externalRef,
    item.contactEmail,
    String(item.sequence),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardBatchViews(items: LeaderboardBatch[]): LeaderboardBatchView[] {
  const views: LeaderboardBatchView[] = [];
  for (const item of items) {
    views.push(toLeaderboardBatchView(item));
  }
  return views;
}

export function sumLeaderboardBatchView(view: LeaderboardBatchView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBatchSize + parsedBid + parsedImpressions;
}
