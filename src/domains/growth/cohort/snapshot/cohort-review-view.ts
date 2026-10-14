import * as text from "../../../../kit/text.js";
import { CohortReview } from "./cohort-review.js";

/** How screens and exports show a cohort review. */
export class CohortReviewView {
  codeText: string;
  name: string;
  utmSource: string;
  batchSize: string;
  segment: string;
  ceilingText: string;
  revisionText: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    utmSource: string,
    batchSize: string,
    segment: string,
    ceilingText: string,
    revisionText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.segment = segment;
    this.ceilingText = ceilingText;
    this.revisionText = revisionText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toCohortReviewView(item: CohortReview): CohortReviewView {
  return new CohortReviewView(
    item.code,
    text.truncate(item.name, 64),
    item.utmSource,
    String(item.batchSize),
    text.truncate(item.segment, 64),
    item.ceiling.toFixed(2),
    String(item.revision),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortReviewViews(items: CohortReview[]): CohortReviewView[] {
  const views: CohortReviewView[] = [];
  for (const item of items) {
    views.push(toCohortReviewView(item));
  }
  return views;
}

export function sumCohortReviewView(view: CohortReviewView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedBatchSize + parsedCeiling + parsedRevision;
}
