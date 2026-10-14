import * as text from "../../../../kit/text.js";
import { TieredModelPolicy } from "./tiered-model-policy.js";

/** How screens and exports show a tiered model policy. */
export class TieredModelPolicyView {
  code: string;
  name: string;
  cost: string;
  cohort: string;
  segmentText: string;
  bidText: string;
  attemptsText: string;
  revisionText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cost: string,
    cohort: string,
    segmentText: string,
    bidText: string,
    attemptsText: string,
    revisionText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.cohort = cohort;
    this.segmentText = segmentText;
    this.bidText = bidText;
    this.attemptsText = attemptsText;
    this.revisionText = revisionText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toTieredModelPolicyView(item: TieredModelPolicy): TieredModelPolicyView {
  return new TieredModelPolicyView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    text.truncate(item.cohort, 40),
    item.segment,
    item.bid.toFixed(2),
    String(item.attempts),
    String(item.revision),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredModelPolicyViews(items: TieredModelPolicy[]): TieredModelPolicyView[] {
  const views: TieredModelPolicyView[] = [];
  for (const item of items) {
    views.push(toTieredModelPolicyView(item));
  }
  return views;
}

export function sumTieredModelPolicyView(view: TieredModelPolicyView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedCost + parsedBid + parsedAttempts;
}
