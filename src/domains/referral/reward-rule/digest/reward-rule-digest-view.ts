import * as text from "../../../../kit/text.js";
import { RewardRuleDigest } from "./reward-rule-digest.js";

/** How screens and exports show a reward rule digest. */
export class RewardRuleDigestView {
  code: string;
  title: string;
  expiresAtText: string;
  cohortText: string;
  windowDays: string;
  label: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAtText: string,
    cohortText: string,
    windowDays: string,
    label: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.cohortText = cohortText;
    this.windowDays = windowDays;
    this.label = label;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleDigestView(item: RewardRuleDigest): RewardRuleDigestView {
  return new RewardRuleDigestView(
    text.truncate(item.code, 64),
    item.title,
    String(item.expiresAt),
    item.cohort,
    String(item.windowDays),
    item.label,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleDigestViews(items: RewardRuleDigest[]): RewardRuleDigestView[] {
  const views: RewardRuleDigestView[] = [];
  for (const item of items) {
    views.push(toRewardRuleDigestView(item));
  }
  return views;
}

export function sumRewardRuleDigestView(view: RewardRuleDigestView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedExpiresAt + parsedWindowDays + parsedCost;
}
