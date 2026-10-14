import * as text from "../../../../kit/text.js";
import { RewardRuleAllocation } from "./reward-rule-allocation.js";

/** How screens and exports show a reward rule allocation. */
export class RewardRuleAllocationView {
  codeText: string;
  label: string;
  cohortText: string;
  campaignRef: string;
  active: string;
  country: string;
  utmSourceText: string;
  conversionRate: string;
  quantity: string;
  timezoneText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cohortText: string,
    campaignRef: string,
    active: string,
    country: string,
    utmSourceText: string,
    conversionRate: string,
    quantity: string,
    timezoneText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cohortText = cohortText;
    this.campaignRef = campaignRef;
    this.active = active;
    this.country = country;
    this.utmSourceText = utmSourceText;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.timezoneText = timezoneText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleAllocationView(item: RewardRuleAllocation): RewardRuleAllocationView {
  return new RewardRuleAllocationView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.cohort, 40),
    item.campaignRef,
    `${item.active}`,
    item.country,
    text.truncate(item.utmSource, 64),
    item.conversionRate.toFixed(2),
    String(item.quantity),
    item.timezone,
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleAllocationViews(items: RewardRuleAllocation[]): RewardRuleAllocationView[] {
  const views: RewardRuleAllocationView[] = [];
  for (const item of items) {
    views.push(toRewardRuleAllocationView(item));
  }
  return views;
}

export function sumRewardRuleAllocationView(view: RewardRuleAllocationView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedConversionRate + parsedQuantity;
}
