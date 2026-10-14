import * as text from "../../../../kit/text.js";
import { RegionalQueueTarget } from "./regional-queue-target.js";

/** How screens and exports show a regional queue target. */
export class RegionalQueueTargetView {
  code: string;
  name: string;
  sequence: string;
  priorityText: string;
  rate: string;
  ratio: string;
  ceiling: string;
  summaryText: string;
  externalRef: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequence: string,
    priorityText: string,
    rate: string,
    ratio: string,
    ceiling: string,
    summaryText: string,
    externalRef: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.priorityText = priorityText;
    this.rate = rate;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.summaryText = summaryText;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueueTargetView(item: RegionalQueueTarget): RegionalQueueTargetView {
  return new RegionalQueueTargetView(
    item.code,
    item.name,
    String(item.sequence),
    String(item.priority),
    item.rate.toFixed(2),
    item.ratio.toFixed(2),
    item.ceiling.toFixed(2),
    text.truncate(item.summary, 120),
    text.truncate(item.externalRef, 64),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueueTargetViews(items: RegionalQueueTarget[]): RegionalQueueTargetView[] {
  const views: RegionalQueueTargetView[] = [];
  for (const item of items) {
    views.push(toRegionalQueueTargetView(item));
  }
  return views;
}

export function sumRegionalQueueTargetView(view: RegionalQueueTargetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedSequence + parsedPriority + parsedRate;
}
