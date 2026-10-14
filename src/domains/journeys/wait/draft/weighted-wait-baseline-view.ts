import { WeightedWaitBaseline } from "./weighted-wait-baseline.js";

/** How screens and exports show a weighted wait baseline. */
export class WeightedWaitBaselineView {
  code: string;
  titleText: string;
  priority: string;
  cost: string;
  unit: string;
  endsAt: string;
  pinned: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    priority: string,
    cost: string,
    unit: string,
    endsAt: string,
    pinned: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.priority = priority;
    this.cost = cost;
    this.unit = unit;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWaitBaselineView(item: WeightedWaitBaseline): WeightedWaitBaselineView {
  return new WeightedWaitBaselineView(
    item.code,
    item.title,
    String(item.priority),
    item.cost.toFixed(2),
    item.unit,
    String(item.endsAt),
    `${item.pinned}`,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWaitBaselineViews(items: WeightedWaitBaseline[]): WeightedWaitBaselineView[] {
  const views: WeightedWaitBaselineView[] = [];
  for (const item of items) {
    views.push(toWeightedWaitBaselineView(item));
  }
  return views;
}

export function sumWeightedWaitBaselineView(view: WeightedWaitBaselineView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedPriority + parsedCost + parsedEndsAt;
}
