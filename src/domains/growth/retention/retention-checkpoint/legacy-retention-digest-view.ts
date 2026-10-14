import { LegacyRetentionDigest } from "./legacy-retention-digest.js";

/** How screens and exports show a legacy retention digest. */
export class LegacyRetentionDigestView {
  code: string;
  titleText: string;
  bid: string;
  channel: string;
  scoreText: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    bid: string,
    channel: string,
    scoreText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.bid = bid;
    this.channel = channel;
    this.scoreText = scoreText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRetentionDigestView(item: LegacyRetentionDigest): LegacyRetentionDigestView {
  return new LegacyRetentionDigestView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.channel,
    item.score.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRetentionDigestViews(items: LegacyRetentionDigest[]): LegacyRetentionDigestView[] {
  const views: LegacyRetentionDigestView[] = [];
  for (const item of items) {
    views.push(toLegacyRetentionDigestView(item));
  }
  return views;
}

export function sumLegacyRetentionDigestView(view: LegacyRetentionDigestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBid + parsedScore + parsedRate;
}
