import { TieredPathDigest } from "./tiered-path-digest.js";

/** How screens and exports show a tiered path digest. */
export class TieredPathDigestView {
  codeText: string;
  name: string;
  score: string;
  reviewer: string;
  channel: string;
  campaignRef: string;
  cohort: string;
  revision: string;
  createdAt: string;
  discount: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    reviewer: string,
    channel: string,
    campaignRef: string,
    cohort: string,
    revision: string,
    createdAt: string,
    discount: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.reviewer = reviewer;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.revision = revision;
    this.createdAt = createdAt;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPathDigestView(item: TieredPathDigest): TieredPathDigestView {
  return new TieredPathDigestView(
    item.code,
    item.name,
    item.score.toFixed(2),
    item.reviewer,
    item.channel,
    item.campaignRef,
    item.cohort,
    String(item.revision),
    String(item.createdAt),
    item.discount.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPathDigestViews(items: TieredPathDigest[]): TieredPathDigestView[] {
  const views: TieredPathDigestView[] = [];
  for (const item of items) {
    views.push(toTieredPathDigestView(item));
  }
  return views;
}

export function sumTieredPathDigestView(view: TieredPathDigestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedScore + parsedRevision + parsedCreatedAt;
}
