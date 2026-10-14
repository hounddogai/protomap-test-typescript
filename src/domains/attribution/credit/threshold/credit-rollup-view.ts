import * as text from "../../../../kit/text.js";
import { CreditRollup } from "./credit-rollup.js";

/** How screens and exports show a credit rollup. */
export class CreditRollupView {
  code: string;
  title: string;
  cohort: string;
  reviewer: string;
  checksum: string;
  category: string;
  threshold: string;
  impressions: string;
  bid: string;
  notesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohort: string,
    reviewer: string,
    checksum: string,
    category: string,
    threshold: string,
    impressions: string,
    bid: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.category = category;
    this.threshold = threshold;
    this.impressions = impressions;
    this.bid = bid;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditRollupView(item: CreditRollup): CreditRollupView {
  return new CreditRollupView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.cohort, 80),
    item.reviewer,
    item.checksum,
    item.category,
    item.threshold.toFixed(2),
    String(item.impressions),
    item.bid.toFixed(2),
    text.truncate(item.notes, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditRollupViews(items: CreditRollup[]): CreditRollupView[] {
  const views: CreditRollupView[] = [];
  for (const item of items) {
    views.push(toCreditRollupView(item));
  }
  return views;
}

export function sumCreditRollupView(view: CreditRollupView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedThreshold + parsedImpressions + parsedBid;
}
