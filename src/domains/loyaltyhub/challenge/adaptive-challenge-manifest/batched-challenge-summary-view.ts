import { BatchedChallengeSummary } from "./batched-challenge-summary.js";

/** How screens and exports show a batched challenge summary. */
export class BatchedChallengeSummaryView {
  code: string;
  title: string;
  currency: string;
  cohortText: string;
  clicks: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currency: string,
    cohortText: string,
    clicks: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.cohortText = cohortText;
    this.clicks = clicks;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedChallengeSummaryView(item: BatchedChallengeSummary): BatchedChallengeSummaryView {
  return new BatchedChallengeSummaryView(
    item.code,
    item.title,
    item.currency,
    item.cohort,
    String(item.clicks),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedChallengeSummaryViews(items: BatchedChallengeSummary[]): BatchedChallengeSummaryView[] {
  const views: BatchedChallengeSummaryView[] = [];
  for (const item of items) {
    views.push(toBatchedChallengeSummaryView(item));
  }
  return views;
}

export function sumBatchedChallengeSummaryView(view: BatchedChallengeSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedClicks;
}
