import * as text from "../../../../kit/text.js";
import { RegionalReplyDraft } from "./regional-reply-draft.js";

/** How screens and exports show a regional reply draft. */
export class RegionalReplyDraftView {
  codeText: string;
  labelText: string;
  country: string;
  quantity: string;
  batchSize: string;
  margin: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    country: string,
    quantity: string,
    batchSize: string,
    margin: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.country = country;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.margin = margin;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReplyDraftView(item: RegionalReplyDraft): RegionalReplyDraftView {
  return new RegionalReplyDraftView(
    item.code,
    item.label,
    text.truncate(item.country, 120),
    String(item.quantity),
    String(item.batchSize),
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReplyDraftViews(items: RegionalReplyDraft[]): RegionalReplyDraftView[] {
  const views: RegionalReplyDraftView[] = [];
  for (const item of items) {
    views.push(toRegionalReplyDraftView(item));
  }
  return views;
}

export function sumRegionalReplyDraftView(view: RegionalReplyDraftView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedQuantity + parsedBatchSize + parsedMargin;
}
