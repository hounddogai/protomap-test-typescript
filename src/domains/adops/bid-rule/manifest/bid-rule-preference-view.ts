import * as text from "../../../../kit/text.js";
import { BidRulePreference } from "./bid-rule-preference.js";

/** How screens and exports show a bid rule preference. */
export class BidRulePreferenceView {
  code: string;
  titleText: string;
  updatedAt: string;
  category: string;
  capacityText: string;
  costText: string;
  visibleText: string;
  attemptsText: string;
  country: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAt: string,
    category: string,
    capacityText: string,
    costText: string,
    visibleText: string,
    attemptsText: string,
    country: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.category = category;
    this.capacityText = capacityText;
    this.costText = costText;
    this.visibleText = visibleText;
    this.attemptsText = attemptsText;
    this.country = country;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toBidRulePreferenceView(item: BidRulePreference): BidRulePreferenceView {
  return new BidRulePreferenceView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.category,
    String(item.capacity),
    item.cost.toFixed(2),
    `${item.visible}`,
    String(item.attempts),
    text.truncate(item.country, 120),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRulePreferenceViews(items: BidRulePreference[]): BidRulePreferenceView[] {
  const views: BidRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toBidRulePreferenceView(item));
  }
  return views;
}

export function sumBidRulePreferenceView(view: BidRulePreferenceView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedUpdatedAt + parsedCapacity + parsedCost;
}
