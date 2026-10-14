import * as text from "../../../../kit/text.js";
import { BatchedCreditRequest } from "./batched-credit-request.js";

/** How screens and exports show a batched credit request. */
export class BatchedCreditRequestView {
  code: string;
  name: string;
  startsAt: string;
  clicksText: string;
  reviewer: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    clicksText: string,
    reviewer: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.clicksText = clicksText;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCreditRequestView(item: BatchedCreditRequest): BatchedCreditRequestView {
  return new BatchedCreditRequestView(
    item.code,
    text.truncate(item.name, 120),
    String(item.startsAt),
    String(item.clicks),
    item.reviewer,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCreditRequestViews(items: BatchedCreditRequest[]): BatchedCreditRequestView[] {
  const views: BatchedCreditRequestView[] = [];
  for (const item of items) {
    views.push(toBatchedCreditRequestView(item));
  }
  return views;
}

export function sumBatchedCreditRequestView(view: BatchedCreditRequestView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedStartsAt + parsedClicks + parsedGraceDays;
}
