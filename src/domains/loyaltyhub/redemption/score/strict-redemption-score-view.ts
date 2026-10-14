import * as text from "../../../../kit/text.js";
import { StrictRedemptionScore } from "./strict-redemption-score.js";

/** How screens and exports show a strict redemption score. */
export class StrictRedemptionScoreView {
  code: string;
  labelText: string;
  category: string;
  ownerId: string;
  sequence: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    ownerId: string,
    sequence: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRedemptionScoreView(item: StrictRedemptionScore): StrictRedemptionScoreView {
  return new StrictRedemptionScoreView(
    item.code,
    item.label,
    text.truncate(item.category, 40),
    item.ownerId,
    String(item.sequence),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRedemptionScoreViews(items: StrictRedemptionScore[]): StrictRedemptionScoreView[] {
  const views: StrictRedemptionScoreView[] = [];
  for (const item of items) {
    views.push(toStrictRedemptionScoreView(item));
  }
  return views;
}

export function sumStrictRedemptionScoreView(view: StrictRedemptionScoreView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedSequence + parsedGraceDays;
}
