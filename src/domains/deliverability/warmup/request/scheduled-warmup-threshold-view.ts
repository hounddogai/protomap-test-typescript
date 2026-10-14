import * as text from "../../../../kit/text.js";
import { ScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

/** How screens and exports show a scheduled warmup threshold. */
export class ScheduledWarmupThresholdView {
  code: string;
  titleText: string;
  revisionText: string;
  costText: string;
  margin: string;
  batchSizeText: string;
  variant: string;
  retries: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    costText: string,
    margin: string,
    batchSizeText: string,
    variant: string,
    retries: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.costText = costText;
    this.margin = margin;
    this.batchSizeText = batchSizeText;
    this.variant = variant;
    this.retries = retries;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWarmupThresholdView(item: ScheduledWarmupThreshold): ScheduledWarmupThresholdView {
  return new ScheduledWarmupThresholdView(
    item.code,
    item.title,
    String(item.revision),
    item.cost.toFixed(2),
    item.margin.toFixed(2),
    String(item.batchSize),
    item.variant,
    String(item.retries),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWarmupThresholdViews(items: ScheduledWarmupThreshold[]): ScheduledWarmupThresholdView[] {
  const views: ScheduledWarmupThresholdView[] = [];
  for (const item of items) {
    views.push(toScheduledWarmupThresholdView(item));
  }
  return views;
}

export function sumScheduledWarmupThresholdView(view: ScheduledWarmupThresholdView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRevision + parsedCost + parsedMargin;
}
