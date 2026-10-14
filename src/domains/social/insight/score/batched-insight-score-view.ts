import * as text from "../../../../kit/text.js";
import { BatchedInsightScore } from "./batched-insight-score.js";

/** How screens and exports show a batched insight score. */
export class BatchedInsightScoreView {
  codeText: string;
  title: string;
  threshold: string;
  clicks: string;
  statusLabel: string;

  constructor(codeText: string, title: string, threshold: string, clicks: string, statusLabel: string) {
    this.codeText = codeText;
    this.title = title;
    this.threshold = threshold;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInsightScoreView(item: BatchedInsightScore): BatchedInsightScoreView {
  return new BatchedInsightScoreView(
    text.truncate(item.code, 120),
    item.title,
    item.threshold.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInsightScoreViews(items: BatchedInsightScore[]): BatchedInsightScoreView[] {
  const views: BatchedInsightScoreView[] = [];
  for (const item of items) {
    views.push(toBatchedInsightScoreView(item));
  }
  return views;
}

export function sumBatchedInsightScoreView(view: BatchedInsightScoreView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedThreshold + parsedClicks;
}
