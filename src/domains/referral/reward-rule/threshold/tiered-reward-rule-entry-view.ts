import { TieredRewardRuleEntry } from "./tiered-reward-rule-entry.js";

/** How screens and exports show a tiered reward rule entry. */
export class TieredRewardRuleEntryView {
  code: string;
  label: string;
  ratio: string;
  approved: string;
  variantText: string;
  clicks: string;
  reviewer: string;
  sendAtText: string;
  cost: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ratio: string,
    approved: string,
    variantText: string,
    clicks: string,
    reviewer: string,
    sendAtText: string,
    cost: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.approved = approved;
    this.variantText = variantText;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.sendAtText = sendAtText;
    this.cost = cost;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleEntryView(item: TieredRewardRuleEntry): TieredRewardRuleEntryView {
  return new TieredRewardRuleEntryView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    `${item.approved}`,
    item.variant,
    String(item.clicks),
    item.reviewer,
    String(item.sendAt),
    item.cost.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleEntryViews(items: TieredRewardRuleEntry[]): TieredRewardRuleEntryView[] {
  const views: TieredRewardRuleEntryView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleEntryView(item));
  }
  return views;
}

export function sumTieredRewardRuleEntryView(view: TieredRewardRuleEntryView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedRatio + parsedClicks + parsedSendAt;
}
