import * as text from "../../../../kit/text.js";
import { LenientSlaReview } from "./lenient-sla-review.js";

/** How screens and exports show a lenient sla review. */
export class LenientSlaReviewView {
  codeText: string;
  titleText: string;
  budgetText: string;
  ratio: string;
  sourceText: string;
  checksum: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    budgetText: string,
    ratio: string,
    sourceText: string,
    checksum: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.budgetText = budgetText;
    this.ratio = ratio;
    this.sourceText = sourceText;
    this.checksum = checksum;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSlaReviewView(item: LenientSlaReview): LenientSlaReviewView {
  return new LenientSlaReviewView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.source, 40),
    item.checksum,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSlaReviewViews(items: LenientSlaReview[]): LenientSlaReviewView[] {
  const views: LenientSlaReviewView[] = [];
  for (const item of items) {
    views.push(toLenientSlaReviewView(item));
  }
  return views;
}

export function sumLenientSlaReviewView(view: LenientSlaReviewView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBudget + parsedRatio + parsedVersion;
}
