import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

/** How screens and exports show a seasonal double opt in batch. */
export class SeasonalDoubleOptInBatchView {
  codeText: string;
  labelText: string;
  budget: string;
  cohort: string;
  createdAt: string;
  retries: string;
  utmSourceText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    budget: string,
    cohort: string,
    createdAt: string,
    retries: string,
    utmSourceText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.budget = budget;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.retries = retries;
    this.utmSourceText = utmSourceText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDoubleOptInBatchView(item: SeasonalDoubleOptInBatch): SeasonalDoubleOptInBatchView {
  return new SeasonalDoubleOptInBatchView(
    item.code,
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    item.cohort,
    String(item.createdAt),
    String(item.retries),
    item.utmSource,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDoubleOptInBatchViews(items: SeasonalDoubleOptInBatch[]): SeasonalDoubleOptInBatchView[] {
  const views: SeasonalDoubleOptInBatchView[] = [];
  for (const item of items) {
    views.push(toSeasonalDoubleOptInBatchView(item));
  }
  return views;
}

export function sumSeasonalDoubleOptInBatchView(view: SeasonalDoubleOptInBatchView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedCreatedAt + parsedRetries;
}
