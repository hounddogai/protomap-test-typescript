import { WeightedWindowOverride } from "./weighted-window-override.js";

/** How screens and exports show a weighted window override. */
export class WeightedWindowOverrideView {
  code: string;
  label: string;
  amount: string;
  score: string;
  clicks: string;
  startsAtText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    score: string,
    clicks: string,
    startsAtText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.score = score;
    this.clicks = clicks;
    this.startsAtText = startsAtText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWindowOverrideView(item: WeightedWindowOverride): WeightedWindowOverrideView {
  return new WeightedWindowOverrideView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    item.score.toFixed(2),
    String(item.clicks),
    String(item.startsAt),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWindowOverrideViews(items: WeightedWindowOverride[]): WeightedWindowOverrideView[] {
  const views: WeightedWindowOverrideView[] = [];
  for (const item of items) {
    views.push(toWeightedWindowOverrideView(item));
  }
  return views;
}

export function sumWeightedWindowOverrideView(view: WeightedWindowOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedAmount + parsedScore + parsedClicks;
}
