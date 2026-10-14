import * as text from "../../../../kit/text.js";
import { OptOutPolicy } from "./opt-out-policy.js";

/** How screens and exports show a opt out policy. */
export class OptOutPolicyView {
  codeText: string;
  name: string;
  priorityText: string;
  campaignRefText: string;
  discountText: string;
  impressionsText: string;
  category: string;
  expiresAt: string;
  weight: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    priorityText: string,
    campaignRefText: string,
    discountText: string,
    impressionsText: string,
    category: string,
    expiresAt: string,
    weight: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.priorityText = priorityText;
    this.campaignRefText = campaignRefText;
    this.discountText = discountText;
    this.impressionsText = impressionsText;
    this.category = category;
    this.expiresAt = expiresAt;
    this.weight = weight;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutPolicyView(item: OptOutPolicy): OptOutPolicyView {
  return new OptOutPolicyView(
    item.code,
    item.name,
    String(item.priority),
    item.campaignRef,
    item.discount.toFixed(2),
    String(item.impressions),
    text.truncate(item.category, 120),
    String(item.expiresAt),
    item.weight.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutPolicyViews(items: OptOutPolicy[]): OptOutPolicyView[] {
  const views: OptOutPolicyView[] = [];
  for (const item of items) {
    views.push(toOptOutPolicyView(item));
  }
  return views;
}

export function sumOptOutPolicyView(view: OptOutPolicyView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedPriority + parsedDiscount + parsedImpressions;
}
