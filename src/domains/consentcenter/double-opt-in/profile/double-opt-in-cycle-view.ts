import * as text from "../../../../kit/text.js";
import { DoubleOptInCycle } from "./double-opt-in-cycle.js";

/** How screens and exports show a double opt in cycle. */
export class DoubleOptInCycleView {
  code: string;
  label: string;
  startsAt: string;
  externalRef: string;
  openRate: string;
  createdAt: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAt: string,
    externalRef: string,
    openRate: string,
    createdAt: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInCycleView(item: DoubleOptInCycle): DoubleOptInCycleView {
  return new DoubleOptInCycleView(
    item.code,
    item.label,
    String(item.startsAt),
    text.truncate(item.externalRef, 64),
    item.openRate.toFixed(2),
    String(item.createdAt),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInCycleViews(items: DoubleOptInCycle[]): DoubleOptInCycleView[] {
  const views: DoubleOptInCycleView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInCycleView(item));
  }
  return views;
}

export function sumDoubleOptInCycleView(view: DoubleOptInCycleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedStartsAt + parsedOpenRate + parsedCreatedAt;
}
