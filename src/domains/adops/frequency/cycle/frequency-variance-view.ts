import * as text from "../../../../kit/text.js";
import { FrequencyVariance } from "./frequency-variance.js";

/** How screens and exports show a frequency variance. */
export class FrequencyVarianceView {
  code: string;
  name: string;
  windowDays: string;
  sendAt: string;
  limit: string;
  approved: string;
  updatedAtText: string;
  sourceText: string;
  budget: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDays: string,
    sendAt: string,
    limit: string,
    approved: string,
    updatedAtText: string,
    sourceText: string,
    budget: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.sendAt = sendAt;
    this.limit = limit;
    this.approved = approved;
    this.updatedAtText = updatedAtText;
    this.sourceText = sourceText;
    this.budget = budget;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyVarianceView(item: FrequencyVariance): FrequencyVarianceView {
  return new FrequencyVarianceView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.windowDays),
    String(item.sendAt),
    String(item.limit),
    `${item.approved}`,
    String(item.updatedAt),
    text.truncate(item.source, 40),
    item.budget.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyVarianceViews(items: FrequencyVariance[]): FrequencyVarianceView[] {
  const views: FrequencyVarianceView[] = [];
  for (const item of items) {
    views.push(toFrequencyVarianceView(item));
  }
  return views;
}

export function sumFrequencyVarianceView(view: FrequencyVarianceView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedWindowDays + parsedSendAt + parsedLimit;
}
