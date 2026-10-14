import * as text from "../../../../kit/text.js";
import { WeightedLevelVariance } from "./weighted-level-variance.js";

/** How screens and exports show a weighted level variance. */
export class WeightedLevelVarianceView {
  code: string;
  label: string;
  batchSize: string;
  audienceId: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSize: string,
    audienceId: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedLevelVarianceView(item: WeightedLevelVariance): WeightedLevelVarianceView {
  return new WeightedLevelVarianceView(
    item.code,
    text.truncate(item.label, 120),
    String(item.batchSize),
    item.audienceId,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedLevelVarianceViews(items: WeightedLevelVariance[]): WeightedLevelVarianceView[] {
  const views: WeightedLevelVarianceView[] = [];
  for (const item of items) {
    views.push(toWeightedLevelVarianceView(item));
  }
  return views;
}

export function sumWeightedLevelVarianceView(view: WeightedLevelVarianceView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
