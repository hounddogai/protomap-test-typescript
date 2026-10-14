import * as text from "../../../../kit/text.js";
import { PacingReview } from "./pacing-review.js";

/** How screens and exports show a pacing review. */
export class PacingReviewView {
  code: string;
  title: string;
  floorValue: string;
  windowDays: string;
  cohortText: string;
  retriesText: string;
  channel: string;
  journeyIdText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    floorValue: string,
    windowDays: string,
    cohortText: string,
    retriesText: string,
    channel: string,
    journeyIdText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.cohortText = cohortText;
    this.retriesText = retriesText;
    this.channel = channel;
    this.journeyIdText = journeyIdText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPacingReviewView(item: PacingReview): PacingReviewView {
  return new PacingReviewView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 40),
    item.floorValue.toFixed(2),
    String(item.windowDays),
    item.cohort,
    String(item.retries),
    text.truncate(item.channel, 120),
    item.journeyId,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingReviewViews(items: PacingReview[]): PacingReviewView[] {
  const views: PacingReviewView[] = [];
  for (const item of items) {
    views.push(toPacingReviewView(item));
  }
  return views;
}

export function sumPacingReviewView(view: PacingReviewView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedFloorValue + parsedWindowDays + parsedRetries;
}
