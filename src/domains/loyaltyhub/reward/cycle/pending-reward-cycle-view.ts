import * as text from "../../../../kit/text.js";
import { PendingRewardCycle } from "./pending-reward-cycle.js";

/** How screens and exports show a pending reward cycle. */
export class PendingRewardCycleView {
  codeText: string;
  label: string;
  notes: string;
  region: string;
  threshold: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notes: string,
    region: string,
    threshold: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notes = notes;
    this.region = region;
    this.threshold = threshold;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardCycleView(item: PendingRewardCycle): PendingRewardCycleView {
  return new PendingRewardCycleView(
    item.code,
    text.truncate(item.label, 80),
    item.notes,
    item.region,
    item.threshold.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardCycleViews(items: PendingRewardCycle[]): PendingRewardCycleView[] {
  const views: PendingRewardCycleView[] = [];
  for (const item of items) {
    views.push(toPendingRewardCycleView(item));
  }
  return views;
}

export function sumPendingRewardCycleView(view: PendingRewardCycleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedThreshold + parsedLimit;
}
