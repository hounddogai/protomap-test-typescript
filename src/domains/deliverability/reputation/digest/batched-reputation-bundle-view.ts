import * as text from "../../../../kit/text.js";
import { BatchedReputationBundle } from "./batched-reputation-bundle.js";

/** How screens and exports show a batched reputation bundle. */
export class BatchedReputationBundleView {
  codeText: string;
  title: string;
  segment: string;
  region: string;
  sendAt: string;
  archived: string;
  scoreText: string;
  minimum: string;
  budgetText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    region: string,
    sendAt: string,
    archived: string,
    scoreText: string,
    minimum: string,
    budgetText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.region = region;
    this.sendAt = sendAt;
    this.archived = archived;
    this.scoreText = scoreText;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedReputationBundleView(item: BatchedReputationBundle): BatchedReputationBundleView {
  return new BatchedReputationBundleView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    item.segment,
    item.region,
    String(item.sendAt),
    `${item.archived}`,
    item.score.toFixed(2),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedReputationBundleViews(items: BatchedReputationBundle[]): BatchedReputationBundleView[] {
  const views: BatchedReputationBundleView[] = [];
  for (const item of items) {
    views.push(toBatchedReputationBundleView(item));
  }
  return views;
}

export function sumBatchedReputationBundleView(view: BatchedReputationBundleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedSendAt + parsedScore + parsedMinimum;
}
