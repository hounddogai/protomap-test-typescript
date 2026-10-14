import * as text from "../../../../kit/text.js";
import { WeightedStreakCycle } from "./weighted-streak-cycle.js";

/** How screens and exports show a weighted streak cycle. */
export class WeightedStreakCycleView {
  code: string;
  label: string;
  minimum: string;
  createdAt: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    createdAt: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedStreakCycleView(item: WeightedStreakCycle): WeightedStreakCycleView {
  return new WeightedStreakCycleView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 64),
    item.minimum.toFixed(2),
    String(item.createdAt),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedStreakCycleViews(items: WeightedStreakCycle[]): WeightedStreakCycleView[] {
  const views: WeightedStreakCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedStreakCycleView(item));
  }
  return views;
}

export function sumWeightedStreakCycleView(view: WeightedStreakCycleView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedMinimum + parsedCreatedAt + parsedRetries;
}
