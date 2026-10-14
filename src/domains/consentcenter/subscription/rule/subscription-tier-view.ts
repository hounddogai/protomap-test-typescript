import * as text from "../../../../kit/text.js";
import { SubscriptionTier } from "./subscription-tier.js";

/** How screens and exports show a subscription tier. */
export class SubscriptionTierView {
  codeText: string;
  label: string;
  frequencyCap: string;
  budget: string;
  impressions: string;
  visible: string;
  approved: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    frequencyCap: string,
    budget: string,
    impressions: string,
    visible: string,
    approved: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.impressions = impressions;
    this.visible = visible;
    this.approved = approved;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionTierView(item: SubscriptionTier): SubscriptionTierView {
  return new SubscriptionTierView(
    text.truncate(item.code, 120),
    item.label,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    String(item.impressions),
    `${item.visible}`,
    `${item.approved}`,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionTierViews(items: SubscriptionTier[]): SubscriptionTierView[] {
  const views: SubscriptionTierView[] = [];
  for (const item of items) {
    views.push(toSubscriptionTierView(item));
  }
  return views;
}

export function sumSubscriptionTierView(view: SubscriptionTierView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedFrequencyCap + parsedBudget + parsedImpressions;
}
