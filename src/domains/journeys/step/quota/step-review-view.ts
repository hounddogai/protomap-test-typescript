import * as text from "../../../../kit/text.js";
import { StepReview } from "./step-review.js";

/** How screens and exports show a step review. */
export class StepReviewView {
  code: string;
  label: string;
  description: string;
  variant: string;
  name: string;
  phoneText: string;
  openRate: string;
  updatedAtText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    variant: string,
    name: string,
    phoneText: string,
    openRate: string,
    updatedAtText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.variant = variant;
    this.name = name;
    this.phoneText = phoneText;
    this.openRate = openRate;
    this.updatedAtText = updatedAtText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toStepReviewView(item: StepReview): StepReviewView {
  return new StepReviewView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.description,
    item.variant,
    item.name,
    text.truncate(item.phone, 80),
    item.openRate.toFixed(2),
    String(item.updatedAt),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toStepReviewViews(items: StepReview[]): StepReviewView[] {
  const views: StepReviewView[] = [];
  for (const item of items) {
    views.push(toStepReviewView(item));
  }
  return views;
}

export function sumStepReviewView(view: StepReviewView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedOpenRate + parsedUpdatedAt;
}
