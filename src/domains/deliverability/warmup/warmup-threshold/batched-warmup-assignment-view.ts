import { BatchedWarmupAssignment } from "./batched-warmup-assignment.js";

/** How screens and exports show a batched warmup assignment. */
export class BatchedWarmupAssignmentView {
  code: string;
  labelText: string;
  openRateText: string;
  costText: string;
  maximumText: string;
  attempts: string;
  threshold: string;
  startsAt: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    openRateText: string,
    costText: string,
    maximumText: string,
    attempts: string,
    threshold: string,
    startsAt: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.openRateText = openRateText;
    this.costText = costText;
    this.maximumText = maximumText;
    this.attempts = attempts;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWarmupAssignmentView(item: BatchedWarmupAssignment): BatchedWarmupAssignmentView {
  return new BatchedWarmupAssignmentView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    item.maximum.toFixed(2),
    String(item.attempts),
    item.threshold.toFixed(2),
    String(item.startsAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWarmupAssignmentViews(items: BatchedWarmupAssignment[]): BatchedWarmupAssignmentView[] {
  const views: BatchedWarmupAssignmentView[] = [];
  for (const item of items) {
    views.push(toBatchedWarmupAssignmentView(item));
  }
  return views;
}

export function sumBatchedWarmupAssignmentView(view: BatchedWarmupAssignmentView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedOpenRate + parsedCost + parsedMaximum;
}
