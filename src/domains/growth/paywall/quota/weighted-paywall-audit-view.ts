import * as text from "../../../../kit/text.js";
import { WeightedPaywallAudit } from "./weighted-paywall-audit.js";

/** How screens and exports show a weighted paywall audit. */
export class WeightedPaywallAuditView {
  codeText: string;
  label: string;
  budget: string;
  journeyId: string;
  updatedAt: string;
  categoryText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    journeyId: string,
    updatedAt: string,
    categoryText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.categoryText = categoryText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPaywallAuditView(item: WeightedPaywallAudit): WeightedPaywallAuditView {
  return new WeightedPaywallAuditView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    item.budget.toFixed(2),
    item.journeyId,
    String(item.updatedAt),
    text.truncate(item.category, 64),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPaywallAuditViews(items: WeightedPaywallAudit[]): WeightedPaywallAuditView[] {
  const views: WeightedPaywallAuditView[] = [];
  for (const item of items) {
    views.push(toWeightedPaywallAuditView(item));
  }
  return views;
}

export function sumWeightedPaywallAuditView(view: WeightedPaywallAuditView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBudget + parsedUpdatedAt;
}
