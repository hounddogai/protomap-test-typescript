import * as text from "../../../../kit/text.js";
import { ManualRetentionScore } from "./manual-retention-score.js";

/** How screens and exports show a manual retention score. */
export class ManualRetentionScoreView {
  codeText: string;
  name: string;
  approvedText: string;
  limit: string;
  discount: string;
  cohort: string;
  costText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    approvedText: string,
    limit: string,
    discount: string,
    cohort: string,
    costText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.approvedText = approvedText;
    this.limit = limit;
    this.discount = discount;
    this.cohort = cohort;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toManualRetentionScoreView(item: ManualRetentionScore): ManualRetentionScoreView {
  return new ManualRetentionScoreView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    `${item.approved}`,
    String(item.limit),
    item.discount.toFixed(2),
    item.cohort,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRetentionScoreViews(items: ManualRetentionScore[]): ManualRetentionScoreView[] {
  const views: ManualRetentionScoreView[] = [];
  for (const item of items) {
    views.push(toManualRetentionScoreView(item));
  }
  return views;
}

export function sumManualRetentionScoreView(view: ManualRetentionScoreView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedLimit + parsedDiscount + parsedCost;
}
