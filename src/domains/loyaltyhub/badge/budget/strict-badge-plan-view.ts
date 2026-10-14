import * as text from "../../../../kit/text.js";
import { StrictBadgePlan } from "./strict-badge-plan.js";

/** How screens and exports show a strict badge plan. */
export class StrictBadgePlanView {
  code: string;
  label: string;
  approved: string;
  impressions: string;
  segmentText: string;
  retries: string;
  campaignRefText: string;
  pinned: string;
  reviewerText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    impressions: string,
    segmentText: string,
    retries: string,
    campaignRefText: string,
    pinned: string,
    reviewerText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.impressions = impressions;
    this.segmentText = segmentText;
    this.retries = retries;
    this.campaignRefText = campaignRefText;
    this.pinned = pinned;
    this.reviewerText = reviewerText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBadgePlanView(item: StrictBadgePlan): StrictBadgePlanView {
  return new StrictBadgePlanView(
    item.code,
    item.label,
    `${item.approved}`,
    String(item.impressions),
    text.truncate(item.segment, 120),
    String(item.retries),
    text.truncate(item.campaignRef, 80),
    `${item.pinned}`,
    item.reviewer,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBadgePlanViews(items: StrictBadgePlan[]): StrictBadgePlanView[] {
  const views: StrictBadgePlanView[] = [];
  for (const item of items) {
    views.push(toStrictBadgePlanView(item));
  }
  return views;
}

export function sumStrictBadgePlanView(view: StrictBadgePlanView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedImpressions + parsedRetries + parsedFloorValue;
}
