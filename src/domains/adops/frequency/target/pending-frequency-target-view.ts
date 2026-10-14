import * as text from "../../../../kit/text.js";
import { PendingFrequencyTarget } from "./pending-frequency-target.js";

/** How screens and exports show a pending frequency target. */
export class PendingFrequencyTargetView {
  code: string;
  titleText: string;
  approvedText: string;
  margin: string;
  variantText: string;
  cost: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approvedText: string,
    margin: string,
    variantText: string,
    cost: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approvedText = approvedText;
    this.margin = margin;
    this.variantText = variantText;
    this.cost = cost;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFrequencyTargetView(item: PendingFrequencyTarget): PendingFrequencyTargetView {
  return new PendingFrequencyTargetView(
    item.code,
    text.truncate(item.title, 40),
    `${item.approved}`,
    item.margin.toFixed(2),
    item.variant,
    item.cost.toFixed(2),
    text.truncate(item.segment, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFrequencyTargetViews(items: PendingFrequencyTarget[]): PendingFrequencyTargetView[] {
  const views: PendingFrequencyTargetView[] = [];
  for (const item of items) {
    views.push(toPendingFrequencyTargetView(item));
  }
  return views;
}

export function sumPendingFrequencyTargetView(view: PendingFrequencyTargetView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedMargin + parsedCost;
}
