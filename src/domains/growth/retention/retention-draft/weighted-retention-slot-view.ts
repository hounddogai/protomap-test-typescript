import { WeightedRetentionSlot } from "./weighted-retention-slot.js";

/** How screens and exports show a weighted retention slot. */
export class WeightedRetentionSlotView {
  code: string;
  label: string;
  versionText: string;
  margin: string;
  contactEmailText: string;
  batchSize: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    versionText: string,
    margin: string,
    contactEmailText: string,
    batchSize: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.versionText = versionText;
    this.margin = margin;
    this.contactEmailText = contactEmailText;
    this.batchSize = batchSize;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRetentionSlotView(item: WeightedRetentionSlot): WeightedRetentionSlotView {
  return new WeightedRetentionSlotView(
    item.code,
    item.label,
    String(item.version),
    item.margin.toFixed(2),
    item.contactEmail,
    String(item.batchSize),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRetentionSlotViews(items: WeightedRetentionSlot[]): WeightedRetentionSlotView[] {
  const views: WeightedRetentionSlotView[] = [];
  for (const item of items) {
    views.push(toWeightedRetentionSlotView(item));
  }
  return views;
}

export function sumWeightedRetentionSlotView(view: WeightedRetentionSlotView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedVersion + parsedMargin + parsedBatchSize;
}
