import * as text from "../../../../kit/text.js";
import { WaitBatch } from "./wait-batch.js";

/** How screens and exports show a wait batch. */
export class WaitBatchView {
  code: string;
  title: string;
  category: string;
  name: string;
  graceDaysText: string;
  country: string;
  budget: string;
  batchSize: string;
  cohortText: string;
  utmSourceText: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    category: string,
    name: string,
    graceDaysText: string,
    country: string,
    budget: string,
    batchSize: string,
    cohortText: string,
    utmSourceText: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.country = country;
    this.budget = budget;
    this.batchSize = batchSize;
    this.cohortText = cohortText;
    this.utmSourceText = utmSourceText;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitBatchView(item: WaitBatch): WaitBatchView {
  return new WaitBatchView(
    item.code,
    text.truncate(item.title, 80),
    item.category,
    item.name,
    String(item.graceDays),
    item.country,
    item.budget.toFixed(2),
    String(item.batchSize),
    item.cohort,
    item.utmSource,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitBatchViews(items: WaitBatch[]): WaitBatchView[] {
  const views: WaitBatchView[] = [];
  for (const item of items) {
    views.push(toWaitBatchView(item));
  }
  return views;
}

export function sumWaitBatchView(view: WaitBatchView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedGraceDays + parsedBudget + parsedBatchSize;
}
