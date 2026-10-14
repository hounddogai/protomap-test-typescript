import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleAgreement } from "./weighted-reward-rule-agreement.js";

/** How screens and exports show a weighted reward rule agreement. */
export class WeightedRewardRuleAgreementView {
  code: string;
  name: string;
  reviewerText: string;
  createdAt: string;
  clicks: string;
  maximumText: string;
  pinned: string;
  titleText: string;
  revision: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewerText: string,
    createdAt: string,
    clicks: string,
    maximumText: string,
    pinned: string,
    titleText: string,
    revision: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewerText = reviewerText;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.maximumText = maximumText;
    this.pinned = pinned;
    this.titleText = titleText;
    this.revision = revision;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardRuleAgreementView(item: WeightedRewardRuleAgreement): WeightedRewardRuleAgreementView {
  return new WeightedRewardRuleAgreementView(
    text.truncate(item.code, 80),
    item.name,
    item.reviewer,
    String(item.createdAt),
    String(item.clicks),
    item.maximum.toFixed(2),
    `${item.pinned}`,
    item.title,
    String(item.revision),
    text.truncate(item.label, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardRuleAgreementViews(items: WeightedRewardRuleAgreement[]): WeightedRewardRuleAgreementView[] {
  const views: WeightedRewardRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardRuleAgreementView(item));
  }
  return views;
}

export function sumWeightedRewardRuleAgreementView(view: WeightedRewardRuleAgreementView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedCreatedAt + parsedClicks + parsedMaximum;
}
