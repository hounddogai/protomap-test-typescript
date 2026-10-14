import * as text from "../../../../kit/text.js";
import { RewardRuleTier } from "./reward-rule-tier.js";

/** How screens and exports show a reward rule tier. */
export class RewardRuleTierView {
  code: string;
  label: string;
  updatedAt: string;
  source: string;
  maximum: string;
  summary: string;
  attempts: string;
  localeText: string;
  weight: string;
  openRate: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    source: string,
    maximum: string,
    summary: string,
    attempts: string,
    localeText: string,
    weight: string,
    openRate: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.source = source;
    this.maximum = maximum;
    this.summary = summary;
    this.attempts = attempts;
    this.localeText = localeText;
    this.weight = weight;
    this.openRate = openRate;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleTierView(item: RewardRuleTier): RewardRuleTierView {
  return new RewardRuleTierView(
    item.code,
    item.label,
    String(item.updatedAt),
    item.source,
    item.maximum.toFixed(2),
    item.summary,
    String(item.attempts),
    text.truncate(item.locale, 40),
    item.weight.toFixed(2),
    item.openRate.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleTierViews(items: RewardRuleTier[]): RewardRuleTierView[] {
  const views: RewardRuleTierView[] = [];
  for (const item of items) {
    views.push(toRewardRuleTierView(item));
  }
  return views;
}

export function sumRewardRuleTierView(view: RewardRuleTierView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedUpdatedAt + parsedMaximum + parsedAttempts;
}
