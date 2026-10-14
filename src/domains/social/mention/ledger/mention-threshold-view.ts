import * as text from "../../../../kit/text.js";
import { MentionThreshold } from "./mention-threshold.js";

/** How screens and exports show a mention threshold. */
export class MentionThresholdView {
  codeText: string;
  title: string;
  conversionRate: string;
  cost: string;
  budgetText: string;
  clicks: string;
  ceilingText: string;
  channel: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    conversionRate: string,
    cost: string,
    budgetText: string,
    clicks: string,
    ceilingText: string,
    channel: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.budgetText = budgetText;
    this.clicks = clicks;
    this.ceilingText = ceilingText;
    this.channel = channel;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toMentionThresholdView(item: MentionThreshold): MentionThresholdView {
  return new MentionThresholdView(
    text.truncate(item.code, 80),
    item.title,
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    String(item.clicks),
    item.ceiling.toFixed(2),
    item.channel,
    text.truncate(item.timezone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionThresholdViews(items: MentionThreshold[]): MentionThresholdView[] {
  const views: MentionThresholdView[] = [];
  for (const item of items) {
    views.push(toMentionThresholdView(item));
  }
  return views;
}

export function sumMentionThresholdView(view: MentionThresholdView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedConversionRate + parsedCost + parsedBudget;
}
