import * as text from "../../../../kit/text.js";
import { CohortScore } from "./cohort-score.js";

/** How screens and exports show a cohort score. */
export class CohortScoreView {
  code: string;
  title: string;
  checksum: string;
  quantity: string;
  threshold: string;
  floorValue: string;
  windowDays: string;
  campaignRef: string;
  endsAt: string;
  phoneText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    checksum: string,
    quantity: string,
    threshold: string,
    floorValue: string,
    windowDays: string,
    campaignRef: string,
    endsAt: string,
    phoneText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.quantity = quantity;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.phoneText = phoneText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toCohortScoreView(item: CohortScore): CohortScoreView {
  return new CohortScoreView(
    text.truncate(item.code, 80),
    item.title,
    item.checksum,
    String(item.quantity),
    item.threshold.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.windowDays),
    text.truncate(item.campaignRef, 64),
    String(item.endsAt),
    item.phone,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortScoreViews(items: CohortScore[]): CohortScoreView[] {
  const views: CohortScoreView[] = [];
  for (const item of items) {
    views.push(toCohortScoreView(item));
  }
  return views;
}

export function sumCohortScoreView(view: CohortScoreView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedQuantity + parsedThreshold + parsedFloorValue;
}
