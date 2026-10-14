import * as text from "../../../../kit/text.js";
import { ManualPathAdjustment } from "./manual-path-adjustment.js";

/** How screens and exports show a manual path adjustment. */
export class ManualPathAdjustmentView {
  code: string;
  name: string;
  batchSize: string;
  checksum: string;
  title: string;
  source: string;
  marginText: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    batchSize: string,
    checksum: string,
    title: string,
    source: string,
    marginText: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.title = title;
    this.source = source;
    this.marginText = marginText;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toManualPathAdjustmentView(item: ManualPathAdjustment): ManualPathAdjustmentView {
  return new ManualPathAdjustmentView(
    item.code,
    text.truncate(item.name, 80),
    String(item.batchSize),
    text.truncate(item.checksum, 80),
    item.title,
    item.source,
    item.margin.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPathAdjustmentViews(items: ManualPathAdjustment[]): ManualPathAdjustmentView[] {
  const views: ManualPathAdjustmentView[] = [];
  for (const item of items) {
    views.push(toManualPathAdjustmentView(item));
  }
  return views;
}

export function sumManualPathAdjustmentView(view: ManualPathAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedBatchSize + parsedMargin;
}
