import * as text from "../../../../kit/text.js";
import { ReputationEstimate } from "./reputation-estimate.js";

/** How screens and exports show a reputation estimate. */
export class ReputationEstimateView {
  codeText: string;
  title: string;
  weightText: string;
  bid: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    weightText: string,
    bid: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.weightText = weightText;
    this.bid = bid;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toReputationEstimateView(item: ReputationEstimate): ReputationEstimateView {
  return new ReputationEstimateView(
    text.truncate(item.code, 64),
    item.title,
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationEstimateViews(items: ReputationEstimate[]): ReputationEstimateView[] {
  const views: ReputationEstimateView[] = [];
  for (const item of items) {
    views.push(toReputationEstimateView(item));
  }
  return views;
}

export function sumReputationEstimateView(view: ReputationEstimateView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedWeight + parsedBid + parsedMaximum;
}
