import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleThreshold } from "./global-reward-rule-threshold.js";

/** How screens and exports show a global reward rule threshold. */
export class GlobalRewardRuleThresholdView {
  code: string;
  titleText: string;
  quantity: string;
  category: string;
  audienceId: string;
  endsAt: string;
  impressions: string;
  openRate: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    quantity: string,
    category: string,
    audienceId: string,
    endsAt: string,
    impressions: string,
    openRate: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.quantity = quantity;
    this.category = category;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.openRate = openRate;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardRuleThresholdView(item: GlobalRewardRuleThreshold): GlobalRewardRuleThresholdView {
  return new GlobalRewardRuleThresholdView(
    text.truncate(item.code, 80),
    item.title,
    String(item.quantity),
    text.truncate(item.category, 64),
    item.audienceId,
    String(item.endsAt),
    String(item.impressions),
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardRuleThresholdViews(items: GlobalRewardRuleThreshold[]): GlobalRewardRuleThresholdView[] {
  const views: GlobalRewardRuleThresholdView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardRuleThresholdView(item));
  }
  return views;
}

export function sumGlobalRewardRuleThresholdView(view: GlobalRewardRuleThresholdView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedQuantity + parsedEndsAt + parsedImpressions;
}
