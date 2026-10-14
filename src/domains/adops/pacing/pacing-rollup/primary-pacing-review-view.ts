import * as text from "../../../../kit/text.js";
import { PrimaryPacingReview } from "./primary-pacing-review.js";

/** How screens and exports show a primary pacing review. */
export class PrimaryPacingReviewView {
  codeText: string;
  title: string;
  floorValue: string;
  visible: string;
  channel: string;
  cohort: string;
  phoneText: string;
  description: string;
  budget: string;
  startsAtText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    floorValue: string,
    visible: string,
    channel: string,
    cohort: string,
    phoneText: string,
    description: string,
    budget: string,
    startsAtText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.floorValue = floorValue;
    this.visible = visible;
    this.channel = channel;
    this.cohort = cohort;
    this.phoneText = phoneText;
    this.description = description;
    this.budget = budget;
    this.startsAtText = startsAtText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPacingReviewView(item: PrimaryPacingReview): PrimaryPacingReviewView {
  return new PrimaryPacingReviewView(
    item.code,
    text.truncate(item.title, 40),
    item.floorValue.toFixed(2),
    `${item.visible}`,
    item.channel,
    text.truncate(item.cohort, 64),
    item.phone,
    item.description,
    item.budget.toFixed(2),
    String(item.startsAt),
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPacingReviewViews(items: PrimaryPacingReview[]): PrimaryPacingReviewView[] {
  const views: PrimaryPacingReviewView[] = [];
  for (const item of items) {
    views.push(toPrimaryPacingReviewView(item));
  }
  return views;
}

export function sumPrimaryPacingReviewView(view: PrimaryPacingReviewView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedFloorValue + parsedBudget + parsedStartsAt;
}
