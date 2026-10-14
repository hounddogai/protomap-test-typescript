import * as text from "../../../../kit/text.js";
import { CsatReview } from "./csat-review.js";

/** How screens and exports show a csat review. */
export class CsatReviewView {
  code: string;
  labelText: string;
  attempts: string;
  budget: string;
  category: string;
  versionText: string;
  discountText: string;
  cohort: string;
  journeyId: string;
  rate: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    attempts: string,
    budget: string,
    category: string,
    versionText: string,
    discountText: string,
    cohort: string,
    journeyId: string,
    rate: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.attempts = attempts;
    this.budget = budget;
    this.category = category;
    this.versionText = versionText;
    this.discountText = discountText;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.rate = rate;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toCsatReviewView(item: CsatReview): CsatReviewView {
  return new CsatReviewView(
    item.code,
    item.label,
    String(item.attempts),
    item.budget.toFixed(2),
    item.category,
    String(item.version),
    item.discount.toFixed(2),
    item.cohort,
    text.truncate(item.journeyId, 120),
    item.rate.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatReviewViews(items: CsatReview[]): CsatReviewView[] {
  const views: CsatReviewView[] = [];
  for (const item of items) {
    views.push(toCsatReviewView(item));
  }
  return views;
}

export function sumCsatReviewView(view: CsatReviewView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedAttempts + parsedBudget + parsedVersion;
}
