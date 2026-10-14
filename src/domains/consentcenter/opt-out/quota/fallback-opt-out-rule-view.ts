import * as text from "../../../../kit/text.js";
import { FallbackOptOutRule } from "./fallback-opt-out-rule.js";

/** How screens and exports show a fallback opt out rule. */
export class FallbackOptOutRuleView {
  code: string;
  label: string;
  budget: string;
  weightText: string;
  audienceId: string;
  reviewerText: string;
  retriesText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    weightText: string,
    audienceId: string,
    reviewerText: string,
    retriesText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.weightText = weightText;
    this.audienceId = audienceId;
    this.reviewerText = reviewerText;
    this.retriesText = retriesText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackOptOutRuleView(item: FallbackOptOutRule): FallbackOptOutRuleView {
  return new FallbackOptOutRuleView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    item.audienceId,
    item.reviewer,
    String(item.retries),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackOptOutRuleViews(items: FallbackOptOutRule[]): FallbackOptOutRuleView[] {
  const views: FallbackOptOutRuleView[] = [];
  for (const item of items) {
    views.push(toFallbackOptOutRuleView(item));
  }
  return views;
}

export function sumFallbackOptOutRuleView(view: FallbackOptOutRuleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedBudget + parsedWeight + parsedRetries;
}
