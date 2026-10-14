import * as text from "../../../../kit/text.js";
import { BatchedSubscriptionSummary } from "./batched-subscription-summary.js";

/** How screens and exports show a batched subscription summary. */
export class BatchedSubscriptionSummaryView {
  code: string;
  label: string;
  batchSize: string;
  audienceId: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSize: string,
    audienceId: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedSubscriptionSummaryView(item: BatchedSubscriptionSummary): BatchedSubscriptionSummaryView {
  return new BatchedSubscriptionSummaryView(
    item.code,
    item.label,
    String(item.batchSize),
    text.truncate(item.audienceId, 120),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedSubscriptionSummaryViews(items: BatchedSubscriptionSummary[]): BatchedSubscriptionSummaryView[] {
  const views: BatchedSubscriptionSummaryView[] = [];
  for (const item of items) {
    views.push(toBatchedSubscriptionSummaryView(item));
  }
  return views;
}

export function sumBatchedSubscriptionSummaryView(view: BatchedSubscriptionSummaryView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
