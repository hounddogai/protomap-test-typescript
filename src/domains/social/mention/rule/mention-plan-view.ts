import * as text from "../../../../kit/text.js";
import { MentionPlan } from "./mention-plan.js";

/** How screens and exports show a mention plan. */
export class MentionPlanView {
  codeText: string;
  label: string;
  reviewer: string;
  minimum: string;
  rate: string;
  conversionRate: string;
  bidText: string;
  discount: string;
  name: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    reviewer: string,
    minimum: string,
    rate: string,
    conversionRate: string,
    bidText: string,
    discount: string,
    name: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.bidText = bidText;
    this.discount = discount;
    this.name = name;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toMentionPlanView(item: MentionPlan): MentionPlanView {
  return new MentionPlanView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.reviewer, 64),
    item.minimum.toFixed(2),
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    item.bid.toFixed(2),
    item.discount.toFixed(2),
    item.name,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionPlanViews(items: MentionPlan[]): MentionPlanView[] {
  const views: MentionPlanView[] = [];
  for (const item of items) {
    views.push(toMentionPlanView(item));
  }
  return views;
}

export function sumMentionPlanView(view: MentionPlanView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedMinimum + parsedRate + parsedConversionRate;
}
