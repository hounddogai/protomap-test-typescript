import { InsightOverride } from "./insight-override.js";

/** How screens and exports show a insight override. */
export class InsightOverrideView {
  code: string;
  name: string;
  channel: string;
  threshold: string;
  costText: string;
  journeyIdText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    threshold: string,
    costText: string,
    journeyIdText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.threshold = threshold;
    this.costText = costText;
    this.journeyIdText = journeyIdText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toInsightOverrideView(item: InsightOverride): InsightOverrideView {
  return new InsightOverrideView(
    item.code,
    item.name,
    item.channel,
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    item.journeyId,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightOverrideViews(items: InsightOverride[]): InsightOverrideView[] {
  const views: InsightOverrideView[] = [];
  for (const item of items) {
    views.push(toInsightOverrideView(item));
  }
  return views;
}

export function sumInsightOverrideView(view: InsightOverrideView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedThreshold + parsedCost;
}
