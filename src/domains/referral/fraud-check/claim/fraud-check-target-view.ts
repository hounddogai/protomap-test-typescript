import * as text from "../../../../kit/text.js";
import { FraudCheckTarget } from "./fraud-check-target.js";

/** How screens and exports show a fraud check target. */
export class FraudCheckTargetView {
  code: string;
  name: string;
  limit: string;
  cost: string;
  unit: string;
  windowDays: string;
  priorityText: string;
  ownerId: string;
  minimum: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    cost: string,
    unit: string,
    windowDays: string,
    priorityText: string,
    ownerId: string,
    minimum: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.cost = cost;
    this.unit = unit;
    this.windowDays = windowDays;
    this.priorityText = priorityText;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckTargetView(item: FraudCheckTarget): FraudCheckTargetView {
  return new FraudCheckTargetView(
    text.truncate(item.code, 40),
    item.name,
    String(item.limit),
    item.cost.toFixed(2),
    item.unit,
    String(item.windowDays),
    String(item.priority),
    item.ownerId,
    item.minimum.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckTargetViews(items: FraudCheckTarget[]): FraudCheckTargetView[] {
  const views: FraudCheckTargetView[] = [];
  for (const item of items) {
    views.push(toFraudCheckTargetView(item));
  }
  return views;
}

export function sumFraudCheckTargetView(view: FraudCheckTargetView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedLimit + parsedCost + parsedWindowDays;
}
