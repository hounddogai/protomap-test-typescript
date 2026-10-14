import * as text from "../../../../kit/text.js";
import { ProofThreshold } from "./proof-threshold.js";

/** How screens and exports show a proof threshold. */
export class ProofThresholdView {
  codeText: string;
  label: string;
  notes: string;
  clicks: string;
  amountText: string;
  pinned: string;
  cohort: string;
  batchSize: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notes: string,
    clicks: string,
    amountText: string,
    pinned: string,
    cohort: string,
    batchSize: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notes = notes;
    this.clicks = clicks;
    this.amountText = amountText;
    this.pinned = pinned;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toProofThresholdView(item: ProofThreshold): ProofThresholdView {
  return new ProofThresholdView(
    item.code,
    item.label,
    text.truncate(item.notes, 120),
    String(item.clicks),
    item.amount.toFixed(2),
    `${item.pinned}`,
    item.cohort,
    String(item.batchSize),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofThresholdViews(items: ProofThreshold[]): ProofThresholdView[] {
  const views: ProofThresholdView[] = [];
  for (const item of items) {
    views.push(toProofThresholdView(item));
  }
  return views;
}

export function sumProofThresholdView(view: ProofThresholdView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedClicks + parsedAmount + parsedBatchSize;
}
