import * as text from "../../../../kit/text.js";
import { TieredBadgeProfile } from "./tiered-badge-profile.js";

/** How screens and exports show a tiered badge profile. */
export class TieredBadgeProfileView {
  codeText: string;
  title: string;
  region: string;
  amount: string;
  ratioText: string;
  openRate: string;
  priority: string;
  sequence: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    region: string,
    amount: string,
    ratioText: string,
    openRate: string,
    priority: string,
    sequence: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.region = region;
    this.amount = amount;
    this.ratioText = ratioText;
    this.openRate = openRate;
    this.priority = priority;
    this.sequence = sequence;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBadgeProfileView(item: TieredBadgeProfile): TieredBadgeProfileView {
  return new TieredBadgeProfileView(
    text.truncate(item.code, 40),
    item.title,
    item.region,
    item.amount.toFixed(2),
    item.ratio.toFixed(2),
    item.openRate.toFixed(2),
    String(item.priority),
    String(item.sequence),
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBadgeProfileViews(items: TieredBadgeProfile[]): TieredBadgeProfileView[] {
  const views: TieredBadgeProfileView[] = [];
  for (const item of items) {
    views.push(toTieredBadgeProfileView(item));
  }
  return views;
}

export function sumTieredBadgeProfileView(view: TieredBadgeProfileView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedAmount + parsedRatio + parsedOpenRate;
}
