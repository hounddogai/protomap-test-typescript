import { BatchedWaitQuota } from "./batched-wait-quota.js";

/** How screens and exports show a batched wait quota. */
export class BatchedWaitQuotaView {
  code: string;
  titleText: string;
  revisionText: string;
  reviewerText: string;
  cohortText: string;
  locale: string;
  amountText: string;
  variant: string;
  scoreText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    reviewerText: string,
    cohortText: string,
    locale: string,
    amountText: string,
    variant: string,
    scoreText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.reviewerText = reviewerText;
    this.cohortText = cohortText;
    this.locale = locale;
    this.amountText = amountText;
    this.variant = variant;
    this.scoreText = scoreText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWaitQuotaView(item: BatchedWaitQuota): BatchedWaitQuotaView {
  return new BatchedWaitQuotaView(
    item.code,
    item.title,
    String(item.revision),
    item.reviewer,
    item.cohort,
    item.locale,
    item.amount.toFixed(2),
    item.variant,
    item.score.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWaitQuotaViews(items: BatchedWaitQuota[]): BatchedWaitQuotaView[] {
  const views: BatchedWaitQuotaView[] = [];
  for (const item of items) {
    views.push(toBatchedWaitQuotaView(item));
  }
  return views;
}

export function sumBatchedWaitQuotaView(view: BatchedWaitQuotaView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedRevision + parsedAmount + parsedScore;
}
