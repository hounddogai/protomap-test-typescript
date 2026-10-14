import * as text from "../../../../kit/text.js";
import { WeightedReputationSummary } from "./weighted-reputation-summary.js";

/** How screens and exports show a weighted reputation summary. */
export class WeightedReputationSummaryView {
  code: string;
  name: string;
  priority: string;
  notes: string;
  timezoneText: string;
  utmSource: string;
  ratioText: string;
  cost: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    notes: string,
    timezoneText: string,
    utmSource: string,
    ratioText: string,
    cost: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.notes = notes;
    this.timezoneText = timezoneText;
    this.utmSource = utmSource;
    this.ratioText = ratioText;
    this.cost = cost;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationSummaryView(item: WeightedReputationSummary): WeightedReputationSummaryView {
  return new WeightedReputationSummaryView(
    item.code,
    item.name,
    String(item.priority),
    item.notes,
    item.timezone,
    text.truncate(item.utmSource, 64),
    item.ratio.toFixed(2),
    item.cost.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationSummaryViews(items: WeightedReputationSummary[]): WeightedReputationSummaryView[] {
  const views: WeightedReputationSummaryView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationSummaryView(item));
  }
  return views;
}

export function sumWeightedReputationSummaryView(view: WeightedReputationSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedPriority + parsedRatio + parsedCost;
}
