import * as text from "../../../../kit/text.js";
import { WeightedJourneyBatch } from "./weighted-journey-batch.js";

/** How screens and exports show a weighted journey batch. */
export class WeightedJourneyBatchView {
  code: string;
  labelText: string;
  priority: string;
  timezone: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    priority: string,
    timezone: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.priority = priority;
    this.timezone = timezone;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedJourneyBatchView(item: WeightedJourneyBatch): WeightedJourneyBatchView {
  return new WeightedJourneyBatchView(
    item.code,
    item.label,
    String(item.priority),
    text.truncate(item.timezone, 40),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedJourneyBatchViews(items: WeightedJourneyBatch[]): WeightedJourneyBatchView[] {
  const views: WeightedJourneyBatchView[] = [];
  for (const item of items) {
    views.push(toWeightedJourneyBatchView(item));
  }
  return views;
}

export function sumWeightedJourneyBatchView(view: WeightedJourneyBatchView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedPriority + parsedMargin;
}
