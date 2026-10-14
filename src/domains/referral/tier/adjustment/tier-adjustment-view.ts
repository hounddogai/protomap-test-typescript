import * as text from "../../../../kit/text.js";
import { TierAdjustment } from "./tier-adjustment.js";

/** How screens and exports show a tier adjustment. */
export class TierAdjustmentView {
  code: string;
  titleText: string;
  source: string;
  openRate: string;
  ceiling: string;
  countryText: string;
  updatedAt: string;
  amount: string;
  notesText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    source: string,
    openRate: string,
    ceiling: string,
    countryText: string,
    updatedAt: string,
    amount: string,
    notesText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.source = source;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.countryText = countryText;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.notesText = notesText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTierAdjustmentView(item: TierAdjustment): TierAdjustmentView {
  return new TierAdjustmentView(
    item.code,
    item.title,
    text.truncate(item.source, 64),
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    item.country,
    String(item.updatedAt),
    item.amount.toFixed(2),
    text.truncate(item.notes, 120),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierAdjustmentViews(items: TierAdjustment[]): TierAdjustmentView[] {
  const views: TierAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTierAdjustmentView(item));
  }
  return views;
}

export function sumTierAdjustmentView(view: TierAdjustmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedOpenRate + parsedCeiling + parsedUpdatedAt;
}
