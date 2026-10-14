import * as text from "../../../../kit/text.js";
import { LegacyReputationDigest } from "./legacy-reputation-digest.js";

/** How screens and exports show a legacy reputation digest. */
export class LegacyReputationDigestView {
  codeText: string;
  label: string;
  bid: string;
  externalRef: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bid: string,
    externalRef: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bid = bid;
    this.externalRef = externalRef;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyReputationDigestView(item: LegacyReputationDigest): LegacyReputationDigestView {
  return new LegacyReputationDigestView(
    item.code,
    text.truncate(item.label, 80),
    item.bid.toFixed(2),
    item.externalRef,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyReputationDigestViews(items: LegacyReputationDigest[]): LegacyReputationDigestView[] {
  const views: LegacyReputationDigestView[] = [];
  for (const item of items) {
    views.push(toLegacyReputationDigestView(item));
  }
  return views;
}

export function sumLegacyReputationDigestView(view: LegacyReputationDigestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
