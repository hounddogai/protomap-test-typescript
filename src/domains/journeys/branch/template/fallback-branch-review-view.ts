import * as text from "../../../../kit/text.js";
import { FallbackBranchReview } from "./fallback-branch-review.js";

/** How screens and exports show a fallback branch review. */
export class FallbackBranchReviewView {
  code: string;
  name: string;
  contactEmail: string;
  reviewer: string;
  floorValue: string;
  threshold: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    reviewer: string,
    floorValue: string,
    threshold: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBranchReviewView(item: FallbackBranchReview): FallbackBranchReviewView {
  return new FallbackBranchReviewView(
    item.code,
    item.name,
    text.truncate(item.contactEmail, 80),
    text.truncate(item.reviewer, 40),
    item.floorValue.toFixed(2),
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBranchReviewViews(items: FallbackBranchReview[]): FallbackBranchReviewView[] {
  const views: FallbackBranchReviewView[] = [];
  for (const item of items) {
    views.push(toFallbackBranchReviewView(item));
  }
  return views;
}

export function sumFallbackBranchReviewView(view: FallbackBranchReviewView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFloorValue + parsedThreshold + parsedBudget;
}
