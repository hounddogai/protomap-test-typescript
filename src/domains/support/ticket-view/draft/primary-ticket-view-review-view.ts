import { PrimaryTicketViewReview } from "./primary-ticket-view-review.js";

/** How screens and exports show a primary ticket view review. */
export class PrimaryTicketViewReviewView {
  code: string;
  label: string;
  budget: string;
  externalRef: string;
  floorValueText: string;
  batchSizeText: string;
  windowDays: string;
  checksum: string;
  attempts: string;
  thresholdText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    externalRef: string,
    floorValueText: string,
    batchSizeText: string,
    windowDays: string,
    checksum: string,
    attempts: string,
    thresholdText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.externalRef = externalRef;
    this.floorValueText = floorValueText;
    this.batchSizeText = batchSizeText;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.attempts = attempts;
    this.thresholdText = thresholdText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTicketViewReviewView(item: PrimaryTicketViewReview): PrimaryTicketViewReviewView {
  return new PrimaryTicketViewReviewView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    item.externalRef,
    item.floorValue.toFixed(2),
    String(item.batchSize),
    String(item.windowDays),
    item.checksum,
    String(item.attempts),
    item.threshold.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTicketViewReviewViews(items: PrimaryTicketViewReview[]): PrimaryTicketViewReviewView[] {
  const views: PrimaryTicketViewReviewView[] = [];
  for (const item of items) {
    views.push(toPrimaryTicketViewReviewView(item));
  }
  return views;
}

export function sumPrimaryTicketViewReviewView(view: PrimaryTicketViewReviewView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBudget + parsedFloorValue + parsedBatchSize;
}
