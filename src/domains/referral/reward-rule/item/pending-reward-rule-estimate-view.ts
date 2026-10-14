import * as text from "../../../../kit/text.js";
import { PendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

/** How screens and exports show a pending reward rule estimate. */
export class PendingRewardRuleEstimateView {
  codeText: string;
  name: string;
  phone: string;
  impressions: string;
  updatedAt: string;
  weightText: string;
  costText: string;
  minimumText: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    phone: string,
    impressions: string,
    updatedAt: string,
    weightText: string,
    costText: string,
    minimumText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.phone = phone;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.weightText = weightText;
    this.costText = costText;
    this.minimumText = minimumText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardRuleEstimateView(item: PendingRewardRuleEstimate): PendingRewardRuleEstimateView {
  return new PendingRewardRuleEstimateView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.phone, 120),
    String(item.impressions),
    String(item.updatedAt),
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardRuleEstimateViews(items: PendingRewardRuleEstimate[]): PendingRewardRuleEstimateView[] {
  const views: PendingRewardRuleEstimateView[] = [];
  for (const item of items) {
    views.push(toPendingRewardRuleEstimateView(item));
  }
  return views;
}

export function sumPendingRewardRuleEstimateView(view: PendingRewardRuleEstimateView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedImpressions + parsedUpdatedAt + parsedWeight;
}
