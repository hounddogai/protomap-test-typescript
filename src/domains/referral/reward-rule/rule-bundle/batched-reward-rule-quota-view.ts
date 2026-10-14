import { BatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

/** How screens and exports show a batched reward rule quota. */
export class BatchedRewardRuleQuotaView {
  code: string;
  titleText: string;
  utmSource: string;
  marginText: string;
  country: string;
  campaignRefText: string;
  currency: string;
  pinned: string;
  limitText: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    utmSource: string,
    marginText: string,
    country: string,
    campaignRefText: string,
    currency: string,
    pinned: string,
    limitText: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.utmSource = utmSource;
    this.marginText = marginText;
    this.country = country;
    this.campaignRefText = campaignRefText;
    this.currency = currency;
    this.pinned = pinned;
    this.limitText = limitText;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRewardRuleQuotaView(item: BatchedRewardRuleQuota): BatchedRewardRuleQuotaView {
  return new BatchedRewardRuleQuotaView(
    item.code,
    item.title,
    item.utmSource,
    item.margin.toFixed(2),
    item.country,
    item.campaignRef,
    item.currency,
    `${item.pinned}`,
    String(item.limit),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRewardRuleQuotaViews(items: BatchedRewardRuleQuota[]): BatchedRewardRuleQuotaView[] {
  const views: BatchedRewardRuleQuotaView[] = [];
  for (const item of items) {
    views.push(toBatchedRewardRuleQuotaView(item));
  }
  return views;
}

export function sumBatchedRewardRuleQuotaView(view: BatchedRewardRuleQuotaView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedMargin + parsedLimit + parsedAttempts;
}
