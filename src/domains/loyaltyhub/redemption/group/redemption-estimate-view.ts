import * as text from "../../../../kit/text.js";
import { RedemptionEstimate } from "./redemption-estimate.js";

/** How screens and exports show a redemption estimate. */
export class RedemptionEstimateView {
  code: string;
  label: string;
  budget: string;
  sequenceText: string;
  audienceId: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    sequenceText: string,
    audienceId: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.sequenceText = sequenceText;
    this.audienceId = audienceId;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionEstimateView(item: RedemptionEstimate): RedemptionEstimateView {
  return new RedemptionEstimateView(
    item.code,
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    String(item.sequence),
    item.audienceId,
    text.truncate(item.currency, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionEstimateViews(items: RedemptionEstimate[]): RedemptionEstimateView[] {
  const views: RedemptionEstimateView[] = [];
  for (const item of items) {
    views.push(toRedemptionEstimateView(item));
  }
  return views;
}

export function sumRedemptionEstimateView(view: RedemptionEstimateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedBudget + parsedSequence;
}
