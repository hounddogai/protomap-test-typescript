import * as text from "../../../../kit/text.js";
import { BatchedBranchPreference } from "./batched-branch-preference.js";

/** How screens and exports show a batched branch preference. */
export class BatchedBranchPreferenceView {
  code: string;
  title: string;
  minimum: string;
  endsAt: string;
  impressionsText: string;
  cost: string;
  variant: string;
  segment: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimum: string,
    endsAt: string,
    impressionsText: string,
    cost: string,
    variant: string,
    segment: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.impressionsText = impressionsText;
    this.cost = cost;
    this.variant = variant;
    this.segment = segment;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBranchPreferenceView(item: BatchedBranchPreference): BatchedBranchPreferenceView {
  return new BatchedBranchPreferenceView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    String(item.endsAt),
    String(item.impressions),
    item.cost.toFixed(2),
    text.truncate(item.variant, 120),
    item.segment,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBranchPreferenceViews(items: BatchedBranchPreference[]): BatchedBranchPreferenceView[] {
  const views: BatchedBranchPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedBranchPreferenceView(item));
  }
  return views;
}

export function sumBatchedBranchPreferenceView(view: BatchedBranchPreferenceView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedMinimum + parsedEndsAt + parsedImpressions;
}
