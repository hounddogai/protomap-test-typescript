import { StreakTarget } from "./streak-target.js";

/** How screens and exports show a streak target. */
export class StreakTargetView {
  code: string;
  label: string;
  costText: string;
  weightText: string;
  bid: string;
  startsAtText: string;
  scoreText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    costText: string,
    weightText: string,
    bid: string,
    startsAtText: string,
    scoreText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.costText = costText;
    this.weightText = weightText;
    this.bid = bid;
    this.startsAtText = startsAtText;
    this.scoreText = scoreText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toStreakTargetView(item: StreakTarget): StreakTargetView {
  return new StreakTargetView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    String(item.startsAt),
    item.score.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakTargetViews(items: StreakTarget[]): StreakTargetView[] {
  const views: StreakTargetView[] = [];
  for (const item of items) {
    views.push(toStreakTargetView(item));
  }
  return views;
}

export function sumStreakTargetView(view: StreakTargetView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedCost + parsedWeight + parsedBid;
}
