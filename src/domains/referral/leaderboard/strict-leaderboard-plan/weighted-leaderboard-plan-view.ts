import * as text from "../../../../kit/text.js";
import { WeightedLeaderboardPlan } from "./weighted-leaderboard-plan.js";

/** How screens and exports show a weighted leaderboard plan. */
export class WeightedLeaderboardPlanView {
  code: string;
  label: string;
  archivedText: string;
  weightText: string;
  currencyText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archivedText: string,
    weightText: string,
    currencyText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archivedText = archivedText;
    this.weightText = weightText;
    this.currencyText = currencyText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedLeaderboardPlanView(item: WeightedLeaderboardPlan): WeightedLeaderboardPlanView {
  return new WeightedLeaderboardPlanView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    `${item.archived}`,
    item.weight.toFixed(2),
    item.currency,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedLeaderboardPlanViews(items: WeightedLeaderboardPlan[]): WeightedLeaderboardPlanView[] {
  const views: WeightedLeaderboardPlanView[] = [];
  for (const item of items) {
    views.push(toWeightedLeaderboardPlanView(item));
  }
  return views;
}

export function sumWeightedLeaderboardPlanView(view: WeightedLeaderboardPlanView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedWeight;
}
