import * as text from "../../../../kit/text.js";
import { RollingSubscriptionScore } from "./rolling-subscription-score.js";

/** How screens and exports show a rolling subscription score. */
export class RollingSubscriptionScoreView {
  code: string;
  title: string;
  graceDays: string;
  weightText: string;
  notes: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    weightText: string,
    notes: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.weightText = weightText;
    this.notes = notes;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSubscriptionScoreView(item: RollingSubscriptionScore): RollingSubscriptionScoreView {
  return new RollingSubscriptionScoreView(
    item.code,
    text.truncate(item.title, 64),
    String(item.graceDays),
    item.weight.toFixed(2),
    item.notes,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSubscriptionScoreViews(items: RollingSubscriptionScore[]): RollingSubscriptionScoreView[] {
  const views: RollingSubscriptionScoreView[] = [];
  for (const item of items) {
    views.push(toRollingSubscriptionScoreView(item));
  }
  return views;
}

export function sumRollingSubscriptionScoreView(view: RollingSubscriptionScoreView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedGraceDays + parsedWeight + parsedClicks;
}
