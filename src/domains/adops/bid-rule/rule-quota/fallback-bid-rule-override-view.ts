import * as text from "../../../../kit/text.js";
import { FallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

/** How screens and exports show a fallback bid rule override. */
export class FallbackBidRuleOverrideView {
  code: string;
  label: string;
  attempts: string;
  reviewerText: string;
  budget: string;
  timezone: string;
  expiresAt: string;
  discount: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attempts: string,
    reviewerText: string,
    budget: string,
    timezone: string,
    expiresAt: string,
    discount: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.reviewerText = reviewerText;
    this.budget = budget;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBidRuleOverrideView(item: FallbackBidRuleOverride): FallbackBidRuleOverrideView {
  return new FallbackBidRuleOverrideView(
    text.truncate(item.code, 64),
    item.label,
    String(item.attempts),
    text.truncate(item.reviewer, 80),
    item.budget.toFixed(2),
    item.timezone,
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBidRuleOverrideViews(items: FallbackBidRuleOverride[]): FallbackBidRuleOverrideView[] {
  const views: FallbackBidRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toFallbackBidRuleOverrideView(item));
  }
  return views;
}

export function sumFallbackBidRuleOverrideView(view: FallbackBidRuleOverrideView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedAttempts + parsedBudget + parsedExpiresAt;
}
