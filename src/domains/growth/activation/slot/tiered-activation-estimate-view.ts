import * as text from "../../../../kit/text.js";
import { TieredActivationEstimate } from "./tiered-activation-estimate.js";

/** How screens and exports show a tiered activation estimate. */
export class TieredActivationEstimateView {
  code: string;
  nameText: string;
  bidText: string;
  budget: string;
  unit: string;
  statusLabel: string;

  constructor(code: string, nameText: string, bidText: string, budget: string, unit: string, statusLabel: string) {
    this.code = code;
    this.nameText = nameText;
    this.bidText = bidText;
    this.budget = budget;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredActivationEstimateView(item: TieredActivationEstimate): TieredActivationEstimateView {
  return new TieredActivationEstimateView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.unit, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredActivationEstimateViews(items: TieredActivationEstimate[]): TieredActivationEstimateView[] {
  const views: TieredActivationEstimateView[] = [];
  for (const item of items) {
    views.push(toTieredActivationEstimateView(item));
  }
  return views;
}

export function sumTieredActivationEstimateView(view: TieredActivationEstimateView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBid + parsedBudget;
}
