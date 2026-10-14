import * as text from "../../../../kit/text.js";
import { ManualStreakEntry } from "./manual-streak-entry.js";

/** How screens and exports show a manual streak entry. */
export class ManualStreakEntryView {
  code: string;
  labelText: string;
  weightText: string;
  threshold: string;
  approvedText: string;
  amount: string;
  updatedAt: string;
  createdAt: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    weightText: string,
    threshold: string,
    approvedText: string,
    amount: string,
    updatedAt: string,
    createdAt: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.weightText = weightText;
    this.threshold = threshold;
    this.approvedText = approvedText;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toManualStreakEntryView(item: ManualStreakEntry): ManualStreakEntryView {
  return new ManualStreakEntryView(
    item.code,
    text.truncate(item.label, 64),
    item.weight.toFixed(2),
    item.threshold.toFixed(2),
    `${item.approved}`,
    item.amount.toFixed(2),
    String(item.updatedAt),
    String(item.createdAt),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStreakEntryViews(items: ManualStreakEntry[]): ManualStreakEntryView[] {
  const views: ManualStreakEntryView[] = [];
  for (const item of items) {
    views.push(toManualStreakEntryView(item));
  }
  return views;
}

export function sumManualStreakEntryView(view: ManualStreakEntryView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedWeight + parsedThreshold + parsedAmount;
}
