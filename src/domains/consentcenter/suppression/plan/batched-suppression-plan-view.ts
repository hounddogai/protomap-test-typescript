import * as text from "../../../../kit/text.js";
import { BatchedSuppressionPlan } from "./batched-suppression-plan.js";

/** How screens and exports show a batched suppression plan. */
export class BatchedSuppressionPlanView {
  code: string;
  name: string;
  description: string;
  region: string;
  floorValue: string;
  limit: string;
  pinned: string;
  titleText: string;
  audienceId: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    region: string,
    floorValue: string,
    limit: string,
    pinned: string,
    titleText: string,
    audienceId: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.region = region;
    this.floorValue = floorValue;
    this.limit = limit;
    this.pinned = pinned;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedSuppressionPlanView(item: BatchedSuppressionPlan): BatchedSuppressionPlanView {
  return new BatchedSuppressionPlanView(
    text.truncate(item.code, 40),
    item.name,
    text.truncate(item.description, 80),
    item.region,
    item.floorValue.toFixed(2),
    String(item.limit),
    `${item.pinned}`,
    item.title,
    item.audienceId,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedSuppressionPlanViews(items: BatchedSuppressionPlan[]): BatchedSuppressionPlanView[] {
  const views: BatchedSuppressionPlanView[] = [];
  for (const item of items) {
    views.push(toBatchedSuppressionPlanView(item));
  }
  return views;
}

export function sumBatchedSuppressionPlanView(view: BatchedSuppressionPlanView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedFloorValue + parsedLimit;
}
