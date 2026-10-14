import * as text from "../../../../kit/text.js";
import { FallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

/** How screens and exports show a fallback fraud check claim. */
export class FallbackFraudCheckClaimView {
  code: string;
  title: string;
  ownerId: string;
  budgetText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    budgetText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.budgetText = budgetText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFraudCheckClaimView(item: FallbackFraudCheckClaim): FallbackFraudCheckClaimView {
  return new FallbackFraudCheckClaimView(
    text.truncate(item.code, 40),
    item.title,
    item.ownerId,
    item.budget.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFraudCheckClaimViews(items: FallbackFraudCheckClaim[]): FallbackFraudCheckClaimView[] {
  const views: FallbackFraudCheckClaimView[] = [];
  for (const item of items) {
    views.push(toFallbackFraudCheckClaimView(item));
  }
  return views;
}

export function sumFallbackFraudCheckClaimView(view: FallbackFraudCheckClaimView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
