import * as text from "../../../../kit/text.js";
import { PacingSegment } from "./pacing-segment.js";

/** How screens and exports show a pacing segment. */
export class PacingSegmentView {
  code: string;
  name: string;
  attempts: string;
  cost: string;
  amount: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    cost: string,
    amount: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.cost = cost;
    this.amount = amount;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toPacingSegmentView(item: PacingSegment): PacingSegmentView {
  return new PacingSegmentView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    String(item.attempts),
    item.cost.toFixed(2),
    item.amount.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingSegmentViews(items: PacingSegment[]): PacingSegmentView[] {
  const views: PacingSegmentView[] = [];
  for (const item of items) {
    views.push(toPacingSegmentView(item));
  }
  return views;
}

export function sumPacingSegmentView(view: PacingSegmentView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAttempts + parsedCost + parsedAmount;
}
