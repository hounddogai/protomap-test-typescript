import { PaywallTemplate } from "./paywall-template.js";

/** How screens and exports show a paywall template. */
export class PaywallTemplateView {
  code: string;
  label: string;
  segment: string;
  budget: string;
  reviewerText: string;
  journeyId: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    budget: string,
    reviewerText: string,
    journeyId: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.budget = budget;
    this.reviewerText = reviewerText;
    this.journeyId = journeyId;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallTemplateView(item: PaywallTemplate): PaywallTemplateView {
  return new PaywallTemplateView(
    item.code,
    item.label,
    item.segment,
    item.budget.toFixed(2),
    item.reviewer,
    item.journeyId,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallTemplateViews(items: PaywallTemplate[]): PaywallTemplateView[] {
  const views: PaywallTemplateView[] = [];
  for (const item of items) {
    views.push(toPaywallTemplateView(item));
  }
  return views;
}

export function sumPaywallTemplateView(view: PaywallTemplateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
