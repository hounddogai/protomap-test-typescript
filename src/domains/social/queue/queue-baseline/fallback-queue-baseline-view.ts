import * as text from "../../../../kit/text.js";
import { FallbackQueueBaseline } from "./fallback-queue-baseline.js";

/** How screens and exports show a fallback queue baseline. */
export class FallbackQueueBaselineView {
  code: string;
  label: string;
  cohort: string;
  archived: string;
  discountText: string;
  campaignRef: string;
  segmentText: string;
  unit: string;
  impressionsText: string;
  priority: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohort: string,
    archived: string,
    discountText: string,
    campaignRef: string,
    segmentText: string,
    unit: string,
    impressionsText: string,
    priority: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.archived = archived;
    this.discountText = discountText;
    this.campaignRef = campaignRef;
    this.segmentText = segmentText;
    this.unit = unit;
    this.impressionsText = impressionsText;
    this.priority = priority;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackQueueBaselineView(item: FallbackQueueBaseline): FallbackQueueBaselineView {
  return new FallbackQueueBaselineView(
    item.code,
    item.label,
    text.truncate(item.cohort, 80),
    `${item.archived}`,
    item.discount.toFixed(2),
    text.truncate(item.campaignRef, 80),
    item.segment,
    item.unit,
    String(item.impressions),
    String(item.priority),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackQueueBaselineViews(items: FallbackQueueBaseline[]): FallbackQueueBaselineView[] {
  const views: FallbackQueueBaselineView[] = [];
  for (const item of items) {
    views.push(toFallbackQueueBaselineView(item));
  }
  return views;
}

export function sumFallbackQueueBaselineView(view: FallbackQueueBaselineView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedDiscount + parsedImpressions + parsedPriority;
}
