import * as text from "../../../../kit/text.js";
import { RollingCohortDraft } from "./rolling-cohort-draft.js";

/** How screens and exports show a rolling cohort draft. */
export class RollingCohortDraftView {
  code: string;
  name: string;
  threshold: string;
  locale: string;
  budgetText: string;
  discount: string;
  attempts: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    locale: string,
    budgetText: string,
    discount: string,
    attempts: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.locale = locale;
    this.budgetText = budgetText;
    this.discount = discount;
    this.attempts = attempts;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCohortDraftView(item: RollingCohortDraft): RollingCohortDraftView {
  return new RollingCohortDraftView(
    text.truncate(item.code, 64),
    item.name,
    item.threshold.toFixed(2),
    text.truncate(item.locale, 80),
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    String(item.attempts),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCohortDraftViews(items: RollingCohortDraft[]): RollingCohortDraftView[] {
  const views: RollingCohortDraftView[] = [];
  for (const item of items) {
    views.push(toRollingCohortDraftView(item));
  }
  return views;
}

export function sumRollingCohortDraftView(view: RollingCohortDraftView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedThreshold + parsedBudget + parsedDiscount;
}
