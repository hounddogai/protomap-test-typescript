import * as text from "../../../../kit/text.js";
import { FrequencyDigest } from "./frequency-digest.js";

/** How screens and exports show a frequency digest. */
export class FrequencyDigestView {
  code: string;
  nameText: string;
  batchSize: string;
  title: string;
  unit: string;
  utmSourceText: string;
  amount: string;
  impressionsText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    batchSize: string,
    title: string,
    unit: string,
    utmSourceText: string,
    amount: string,
    impressionsText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.title = title;
    this.unit = unit;
    this.utmSourceText = utmSourceText;
    this.amount = amount;
    this.impressionsText = impressionsText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyDigestView(item: FrequencyDigest): FrequencyDigestView {
  return new FrequencyDigestView(
    item.code,
    item.name,
    String(item.batchSize),
    item.title,
    item.unit,
    text.truncate(item.utmSource, 120),
    item.amount.toFixed(2),
    String(item.impressions),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyDigestViews(items: FrequencyDigest[]): FrequencyDigestView[] {
  const views: FrequencyDigestView[] = [];
  for (const item of items) {
    views.push(toFrequencyDigestView(item));
  }
  return views;
}

export function sumFrequencyDigestView(view: FrequencyDigestView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBatchSize + parsedAmount + parsedImpressions;
}
