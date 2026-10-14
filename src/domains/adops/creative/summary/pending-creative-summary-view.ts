import * as text from "../../../../kit/text.js";
import { PendingCreativeSummary } from "./pending-creative-summary.js";

/** How screens and exports show a pending creative summary. */
export class PendingCreativeSummaryView {
  code: string;
  name: string;
  label: string;
  titleText: string;
  reviewerText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    titleText: string,
    reviewerText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.titleText = titleText;
    this.reviewerText = reviewerText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreativeSummaryView(item: PendingCreativeSummary): PendingCreativeSummaryView {
  return new PendingCreativeSummaryView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 64),
    item.label,
    item.title,
    item.reviewer,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreativeSummaryViews(items: PendingCreativeSummary[]): PendingCreativeSummaryView[] {
  const views: PendingCreativeSummaryView[] = [];
  for (const item of items) {
    views.push(toPendingCreativeSummaryView(item));
  }
  return views;
}

export function sumPendingCreativeSummaryView(view: PendingCreativeSummaryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
