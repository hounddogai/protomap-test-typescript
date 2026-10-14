import * as text from "../../../../kit/text.js";
import { RewardAdjustment } from "./reward-adjustment.js";

/** How screens and exports show a reward adjustment. */
export class RewardAdjustmentView {
  code: string;
  nameText: string;
  budgetText: string;
  currency: string;
  sequence: string;
  segment: string;
  variant: string;
  localeText: string;
  description: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budgetText: string,
    currency: string,
    sequence: string,
    segment: string,
    variant: string,
    localeText: string,
    description: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budgetText = budgetText;
    this.currency = currency;
    this.sequence = sequence;
    this.segment = segment;
    this.variant = variant;
    this.localeText = localeText;
    this.description = description;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRewardAdjustmentView(item: RewardAdjustment): RewardAdjustmentView {
  return new RewardAdjustmentView(
    text.truncate(item.code, 120),
    item.name,
    item.budget.toFixed(2),
    text.truncate(item.currency, 120),
    String(item.sequence),
    text.truncate(item.segment, 40),
    text.truncate(item.variant, 40),
    text.truncate(item.locale, 80),
    item.description,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardAdjustmentViews(items: RewardAdjustment[]): RewardAdjustmentView[] {
  const views: RewardAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRewardAdjustmentView(item));
  }
  return views;
}

export function sumRewardAdjustmentView(view: RewardAdjustmentView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBudget + parsedSequence + parsedWeight;
}
