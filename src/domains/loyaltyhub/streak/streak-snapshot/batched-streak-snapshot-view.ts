import * as text from "../../../../kit/text.js";
import { BatchedStreakSnapshot } from "./batched-streak-snapshot.js";

/** How screens and exports show a batched streak snapshot. */
export class BatchedStreakSnapshotView {
  code: string;
  title: string;
  descriptionText: string;
  frequencyCap: string;
  conversionRate: string;
  expiresAt: string;
  locale: string;
  currency: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    descriptionText: string,
    frequencyCap: string,
    conversionRate: string,
    expiresAt: string,
    locale: string,
    currency: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.descriptionText = descriptionText;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.currency = currency;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedStreakSnapshotView(item: BatchedStreakSnapshot): BatchedStreakSnapshotView {
  return new BatchedStreakSnapshotView(
    item.code,
    item.title,
    item.description,
    String(item.frequencyCap),
    item.conversionRate.toFixed(2),
    String(item.expiresAt),
    item.locale,
    text.truncate(item.currency, 40),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedStreakSnapshotViews(items: BatchedStreakSnapshot[]): BatchedStreakSnapshotView[] {
  const views: BatchedStreakSnapshotView[] = [];
  for (const item of items) {
    views.push(toBatchedStreakSnapshotView(item));
  }
  return views;
}

export function sumBatchedStreakSnapshotView(view: BatchedStreakSnapshotView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFrequencyCap + parsedConversionRate + parsedExpiresAt;
}
