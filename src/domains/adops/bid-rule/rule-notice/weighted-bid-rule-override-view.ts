import * as text from "../../../../kit/text.js";
import { WeightedBidRuleOverride } from "./weighted-bid-rule-override.js";

/** How screens and exports show a weighted bid rule override. */
export class WeightedBidRuleOverrideView {
  code: string;
  label: string;
  archived: string;
  summary: string;
  audienceIdText: string;
  notes: string;
  journeyId: string;
  reviewer: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    summary: string,
    audienceIdText: string,
    notes: string,
    journeyId: string,
    reviewer: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.summary = summary;
    this.audienceIdText = audienceIdText;
    this.notes = notes;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBidRuleOverrideView(item: WeightedBidRuleOverride): WeightedBidRuleOverrideView {
  return new WeightedBidRuleOverrideView(
    item.code,
    item.label,
    `${item.archived}`,
    item.summary,
    item.audienceId,
    item.notes,
    text.truncate(item.journeyId, 64),
    item.reviewer,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBidRuleOverrideViews(items: WeightedBidRuleOverride[]): WeightedBidRuleOverrideView[] {
  const views: WeightedBidRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toWeightedBidRuleOverrideView(item));
  }
  return views;
}

export function sumWeightedBidRuleOverrideView(view: WeightedBidRuleOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
