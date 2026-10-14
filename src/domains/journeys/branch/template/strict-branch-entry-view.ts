import * as text from "../../../../kit/text.js";
import { StrictBranchEntry } from "./strict-branch-entry.js";

/** How screens and exports show a strict branch entry. */
export class StrictBranchEntryView {
  codeText: string;
  label: string;
  threshold: string;
  quantityText: string;
  clicks: string;
  segment: string;
  frequencyCap: string;
  budget: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    threshold: string,
    quantityText: string,
    clicks: string,
    segment: string,
    frequencyCap: string,
    budget: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.threshold = threshold;
    this.quantityText = quantityText;
    this.clicks = clicks;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBranchEntryView(item: StrictBranchEntry): StrictBranchEntryView {
  return new StrictBranchEntryView(
    item.code,
    text.truncate(item.label, 64),
    item.threshold.toFixed(2),
    String(item.quantity),
    String(item.clicks),
    item.segment,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBranchEntryViews(items: StrictBranchEntry[]): StrictBranchEntryView[] {
  const views: StrictBranchEntryView[] = [];
  for (const item of items) {
    views.push(toStrictBranchEntryView(item));
  }
  return views;
}

export function sumStrictBranchEntryView(view: StrictBranchEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedThreshold + parsedQuantity + parsedClicks;
}
