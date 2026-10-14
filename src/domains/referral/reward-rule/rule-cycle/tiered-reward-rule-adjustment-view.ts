import { TieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

/** How screens and exports show a tiered reward rule adjustment. */
export class TieredRewardRuleAdjustmentView {
  codeText: string;
  titleText: string;
  impressions: string;
  durationMinutes: string;
  retriesText: string;
  budget: string;
  threshold: string;
  quantity: string;
  active: string;
  startsAt: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    impressions: string,
    durationMinutes: string,
    retriesText: string,
    budget: string,
    threshold: string,
    quantity: string,
    active: string,
    startsAt: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.retriesText = retriesText;
    this.budget = budget;
    this.threshold = threshold;
    this.quantity = quantity;
    this.active = active;
    this.startsAt = startsAt;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleAdjustmentView(item: TieredRewardRuleAdjustment): TieredRewardRuleAdjustmentView {
  return new TieredRewardRuleAdjustmentView(
    item.code,
    item.title,
    String(item.impressions),
    String(item.durationMinutes),
    String(item.retries),
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    String(item.quantity),
    `${item.active}`,
    String(item.startsAt),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleAdjustmentViews(items: TieredRewardRuleAdjustment[]): TieredRewardRuleAdjustmentView[] {
  const views: TieredRewardRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleAdjustmentView(item));
  }
  return views;
}

export function sumTieredRewardRuleAdjustmentView(view: TieredRewardRuleAdjustmentView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedImpressions + parsedDurationMinutes + parsedRetries;
}
