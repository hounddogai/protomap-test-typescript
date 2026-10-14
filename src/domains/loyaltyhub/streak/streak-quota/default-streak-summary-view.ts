import * as text from "../../../../kit/text.js";
import { DefaultStreakSummary } from "./default-streak-summary.js";

/** How screens and exports show a default streak summary. */
export class DefaultStreakSummaryView {
  code: string;
  label: string;
  archivedText: string;
  updatedAtText: string;
  reviewerText: string;
  localeText: string;
  region: string;
  batchSize: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archivedText: string,
    updatedAtText: string,
    reviewerText: string,
    localeText: string,
    region: string,
    batchSize: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archivedText = archivedText;
    this.updatedAtText = updatedAtText;
    this.reviewerText = reviewerText;
    this.localeText = localeText;
    this.region = region;
    this.batchSize = batchSize;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultStreakSummaryView(item: DefaultStreakSummary): DefaultStreakSummaryView {
  return new DefaultStreakSummaryView(
    item.code,
    item.label,
    `${item.archived}`,
    String(item.updatedAt),
    item.reviewer,
    text.truncate(item.locale, 120),
    text.truncate(item.region, 64),
    String(item.batchSize),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultStreakSummaryViews(items: DefaultStreakSummary[]): DefaultStreakSummaryView[] {
  const views: DefaultStreakSummaryView[] = [];
  for (const item of items) {
    views.push(toDefaultStreakSummaryView(item));
  }
  return views;
}

export function sumDefaultStreakSummaryView(view: DefaultStreakSummaryView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedUpdatedAt + parsedBatchSize + parsedQuantity;
}
