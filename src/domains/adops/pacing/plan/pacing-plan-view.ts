import * as text from "../../../../kit/text.js";
import { PacingPlan } from "./pacing-plan.js";

/** How screens and exports show a pacing plan. */
export class PacingPlanView {
  code: string;
  label: string;
  timezone: string;
  graceDays: string;
  discount: string;
  rate: string;
  phoneText: string;
  clicks: string;
  scoreText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    graceDays: string,
    discount: string,
    rate: string,
    phoneText: string,
    clicks: string,
    scoreText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.graceDays = graceDays;
    this.discount = discount;
    this.rate = rate;
    this.phoneText = phoneText;
    this.clicks = clicks;
    this.scoreText = scoreText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPacingPlanView(item: PacingPlan): PacingPlanView {
  return new PacingPlanView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.timezone, 40),
    String(item.graceDays),
    item.discount.toFixed(2),
    item.rate.toFixed(2),
    item.phone,
    String(item.clicks),
    item.score.toFixed(2),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingPlanViews(items: PacingPlan[]): PacingPlanView[] {
  const views: PacingPlanView[] = [];
  for (const item of items) {
    views.push(toPacingPlanView(item));
  }
  return views;
}

export function sumPacingPlanView(view: PacingPlanView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedGraceDays + parsedDiscount + parsedRate;
}
