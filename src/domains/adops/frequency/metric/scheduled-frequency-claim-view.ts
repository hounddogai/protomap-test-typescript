import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

/** How screens and exports show a scheduled frequency claim. */
export class ScheduledFrequencyClaimView {
  codeText: string;
  label: string;
  batchSizeText: string;
  ceilingText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    batchSizeText: string,
    ceilingText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.batchSizeText = batchSizeText;
    this.ceilingText = ceilingText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFrequencyClaimView(item: ScheduledFrequencyClaim): ScheduledFrequencyClaimView {
  return new ScheduledFrequencyClaimView(
    text.truncate(item.code, 64),
    item.label,
    String(item.batchSize),
    item.ceiling.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFrequencyClaimViews(items: ScheduledFrequencyClaim[]): ScheduledFrequencyClaimView[] {
  const views: ScheduledFrequencyClaimView[] = [];
  for (const item of items) {
    views.push(toScheduledFrequencyClaimView(item));
  }
  return views;
}

export function sumScheduledFrequencyClaimView(view: ScheduledFrequencyClaimView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedBatchSize + parsedCeiling;
}
