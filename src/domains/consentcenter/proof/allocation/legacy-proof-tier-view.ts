import { LegacyProofTier } from "./legacy-proof-tier.js";

/** How screens and exports show a legacy proof tier. */
export class LegacyProofTierView {
  code: string;
  label: string;
  archived: string;
  checksum: string;
  bid: string;
  marginText: string;
  summaryText: string;
  startsAt: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    checksum: string,
    bid: string,
    marginText: string,
    summaryText: string,
    startsAt: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.checksum = checksum;
    this.bid = bid;
    this.marginText = marginText;
    this.summaryText = summaryText;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyProofTierView(item: LegacyProofTier): LegacyProofTierView {
  return new LegacyProofTierView(
    item.code,
    item.label,
    `${item.archived}`,
    item.checksum,
    item.bid.toFixed(2),
    item.margin.toFixed(2),
    item.summary,
    String(item.startsAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyProofTierViews(items: LegacyProofTier[]): LegacyProofTierView[] {
  const views: LegacyProofTierView[] = [];
  for (const item of items) {
    views.push(toLegacyProofTierView(item));
  }
  return views;
}

export function sumLegacyProofTierView(view: LegacyProofTierView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBid + parsedMargin + parsedStartsAt;
}
