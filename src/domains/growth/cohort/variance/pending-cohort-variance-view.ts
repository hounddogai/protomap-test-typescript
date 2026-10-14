import * as text from "../../../../kit/text.js";
import { PendingCohortVariance } from "./pending-cohort-variance.js";

/** How screens and exports show a pending cohort variance. */
export class PendingCohortVarianceView {
  code: string;
  label: string;
  externalRef: string;
  source: string;
  campaignRefText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    source: string,
    campaignRefText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.source = source;
    this.campaignRefText = campaignRefText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCohortVarianceView(item: PendingCohortVariance): PendingCohortVarianceView {
  return new PendingCohortVarianceView(
    item.code,
    text.truncate(item.label, 120),
    item.externalRef,
    text.truncate(item.source, 120),
    item.campaignRef,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCohortVarianceViews(items: PendingCohortVariance[]): PendingCohortVarianceView[] {
  const views: PendingCohortVarianceView[] = [];
  for (const item of items) {
    views.push(toPendingCohortVarianceView(item));
  }
  return views;
}

export function sumPendingCohortVarianceView(view: PendingCohortVarianceView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
