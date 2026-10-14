import * as text from "../../../../kit/text.js";
import { GlobalBranchReview } from "./global-branch-review.js";

/** How screens and exports show a global branch review. */
export class GlobalBranchReviewView {
  codeText: string;
  labelText: string;
  cost: string;
  locale: string;
  frequencyCap: string;
  archivedText: string;
  variantText: string;
  checksum: string;
  cohortText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    locale: string,
    frequencyCap: string,
    archivedText: string,
    variantText: string,
    checksum: string,
    cohortText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.archivedText = archivedText;
    this.variantText = variantText;
    this.checksum = checksum;
    this.cohortText = cohortText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchReviewView(item: GlobalBranchReview): GlobalBranchReviewView {
  return new GlobalBranchReviewView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    text.truncate(item.locale, 64),
    String(item.frequencyCap),
    `${item.archived}`,
    item.variant,
    item.checksum,
    text.truncate(item.cohort, 120),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchReviewViews(items: GlobalBranchReview[]): GlobalBranchReviewView[] {
  const views: GlobalBranchReviewView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchReviewView(item));
  }
  return views;
}

export function sumGlobalBranchReviewView(view: GlobalBranchReviewView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCost + parsedFrequencyCap;
}
