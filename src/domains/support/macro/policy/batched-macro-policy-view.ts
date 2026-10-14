import * as text from "../../../../kit/text.js";
import { BatchedMacroPolicy } from "./batched-macro-policy.js";

/** How screens and exports show a batched macro policy. */
export class BatchedMacroPolicyView {
  codeText: string;
  label: string;
  score: string;
  locale: string;
  impressions: string;
  reviewerText: string;
  revision: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    score: string,
    locale: string,
    impressions: string,
    reviewerText: string,
    revision: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.score = score;
    this.locale = locale;
    this.impressions = impressions;
    this.reviewerText = reviewerText;
    this.revision = revision;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedMacroPolicyView(item: BatchedMacroPolicy): BatchedMacroPolicyView {
  return new BatchedMacroPolicyView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    item.score.toFixed(2),
    item.locale,
    String(item.impressions),
    item.reviewer,
    String(item.revision),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedMacroPolicyViews(items: BatchedMacroPolicy[]): BatchedMacroPolicyView[] {
  const views: BatchedMacroPolicyView[] = [];
  for (const item of items) {
    views.push(toBatchedMacroPolicyView(item));
  }
  return views;
}

export function sumBatchedMacroPolicyView(view: BatchedMacroPolicyView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedScore + parsedImpressions + parsedRevision;
}
