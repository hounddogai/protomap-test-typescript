import { WeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

/** How screens and exports show a weighted reward rule preference. */
export class WeightedRewardRulePreferenceView {
  code: string;
  titleText: string;
  updatedAt: string;
  phone: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAt: string,
    phone: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardRulePreferenceView(item: WeightedRewardRulePreference): WeightedRewardRulePreferenceView {
  return new WeightedRewardRulePreferenceView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.phone,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardRulePreferenceViews(items: WeightedRewardRulePreference[]): WeightedRewardRulePreferenceView[] {
  const views: WeightedRewardRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardRulePreferenceView(item));
  }
  return views;
}

export function sumWeightedRewardRulePreferenceView(view: WeightedRewardRulePreferenceView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
