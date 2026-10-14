import * as text from "../../../../kit/text.js";
import { TieredTierBaseline } from "./tiered-tier-baseline.js";

/** How screens and exports show a tiered tier baseline. */
export class TieredTierBaselineView {
  code: string;
  name: string;
  phoneText: string;
  ceiling: string;
  weightText: string;
  reviewer: string;
  startsAtText: string;
  bid: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phoneText: string,
    ceiling: string,
    weightText: string,
    reviewer: string,
    startsAtText: string,
    bid: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phoneText = phoneText;
    this.ceiling = ceiling;
    this.weightText = weightText;
    this.reviewer = reviewer;
    this.startsAtText = startsAtText;
    this.bid = bid;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTierBaselineView(item: TieredTierBaseline): TieredTierBaselineView {
  return new TieredTierBaselineView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    text.truncate(item.phone, 40),
    item.ceiling.toFixed(2),
    item.weight.toFixed(2),
    item.reviewer,
    String(item.startsAt),
    item.bid.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTierBaselineViews(items: TieredTierBaseline[]): TieredTierBaselineView[] {
  const views: TieredTierBaselineView[] = [];
  for (const item of items) {
    views.push(toTieredTierBaselineView(item));
  }
  return views;
}

export function sumTieredTierBaselineView(view: TieredTierBaselineView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedCeiling + parsedWeight + parsedStartsAt;
}
