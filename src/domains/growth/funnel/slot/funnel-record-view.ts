import * as text from "../../../../kit/text.js";
import { FunnelRecord } from "./funnel-record.js";

/** How screens and exports show a funnel record. */
export class FunnelRecordView {
  code: string;
  labelText: string;
  batchSize: string;
  maximum: string;
  createdAt: string;
  margin: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    batchSize: string,
    maximum: string,
    createdAt: string,
    margin: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.margin = margin;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelRecordView(item: FunnelRecord): FunnelRecordView {
  return new FunnelRecordView(
    text.truncate(item.code, 120),
    item.label,
    String(item.batchSize),
    item.maximum.toFixed(2),
    String(item.createdAt),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelRecordViews(items: FunnelRecord[]): FunnelRecordView[] {
  const views: FunnelRecordView[] = [];
  for (const item of items) {
    views.push(toFunnelRecordView(item));
  }
  return views;
}

export function sumFunnelRecordView(view: FunnelRecordView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBatchSize + parsedMaximum + parsedCreatedAt;
}
