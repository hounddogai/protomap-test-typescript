import { RewardRuleQuota } from "./reward-rule-quota.js";

/** How screens and exports show a reward rule quota. */
export class RewardRuleQuotaView {
  codeText: string;
  label: string;
  utmSourceText: string;
  windowDays: string;
  campaignRef: string;
  descriptionText: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    utmSourceText: string,
    windowDays: string,
    campaignRef: string,
    descriptionText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.descriptionText = descriptionText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleQuotaView(item: RewardRuleQuota): RewardRuleQuotaView {
  return new RewardRuleQuotaView(
    item.code,
    item.label,
    item.utmSource,
    String(item.windowDays),
    item.campaignRef,
    item.description,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleQuotaViews(items: RewardRuleQuota[]): RewardRuleQuotaView[] {
  const views: RewardRuleQuotaView[] = [];
  for (const item of items) {
    views.push(toRewardRuleQuotaView(item));
  }
  return views;
}

export function sumRewardRuleQuotaView(view: RewardRuleQuotaView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
