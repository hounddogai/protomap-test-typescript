import * as text from "../../../../kit/text.js";
import { PayoutPlan } from "./payout-plan.js";

/** How screens and exports show a payout plan. */
export class PayoutPlanView {
  code: string;
  nameText: string;
  score: string;
  summary: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    score: string,
    summary: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.score = score;
    this.summary = summary;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutPlanView(item: PayoutPlan): PayoutPlanView {
  return new PayoutPlanView(
    text.truncate(item.code, 64),
    item.name,
    item.score.toFixed(2),
    item.summary,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutPlanViews(items: PayoutPlan[]): PayoutPlanView[] {
  const views: PayoutPlanView[] = [];
  for (const item of items) {
    views.push(toPayoutPlanView(item));
  }
  return views;
}

export function sumPayoutPlanView(view: PayoutPlanView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
