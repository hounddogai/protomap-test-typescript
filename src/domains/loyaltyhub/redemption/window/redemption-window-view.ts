import * as text from "../../../../kit/text.js";
import { RedemptionWindow } from "./redemption-window.js";

/** How screens and exports show a redemption window. */
export class RedemptionWindowView {
  codeText: string;
  title: string;
  batchSizeText: string;
  summaryText: string;
  country: string;
  weight: string;
  cohortText: string;
  durationMinutes: string;
  endsAt: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    batchSizeText: string,
    summaryText: string,
    country: string,
    weight: string,
    cohortText: string,
    durationMinutes: string,
    endsAt: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.batchSizeText = batchSizeText;
    this.summaryText = summaryText;
    this.country = country;
    this.weight = weight;
    this.cohortText = cohortText;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionWindowView(item: RedemptionWindow): RedemptionWindowView {
  return new RedemptionWindowView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    String(item.batchSize),
    text.truncate(item.summary, 80),
    item.country,
    item.weight.toFixed(2),
    item.cohort,
    String(item.durationMinutes),
    String(item.endsAt),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionWindowViews(items: RedemptionWindow[]): RedemptionWindowView[] {
  const views: RedemptionWindowView[] = [];
  for (const item of items) {
    views.push(toRedemptionWindowView(item));
  }
  return views;
}

export function sumRedemptionWindowView(view: RedemptionWindowView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBatchSize + parsedWeight + parsedDurationMinutes;
}
