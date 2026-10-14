import * as text from "../../../../kit/text.js";
import { DefaultConversionSnapshot } from "./default-conversion-snapshot.js";

/** How screens and exports show a default conversion snapshot. */
export class DefaultConversionSnapshotView {
  codeText: string;
  name: string;
  approved: string;
  createdAt: string;
  batchSizeText: string;
  channel: string;
  variantText: string;
  limitText: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    approved: string,
    createdAt: string,
    batchSizeText: string,
    channel: string,
    variantText: string,
    limitText: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.approved = approved;
    this.createdAt = createdAt;
    this.batchSizeText = batchSizeText;
    this.channel = channel;
    this.variantText = variantText;
    this.limitText = limitText;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultConversionSnapshotView(item: DefaultConversionSnapshot): DefaultConversionSnapshotView {
  return new DefaultConversionSnapshotView(
    item.code,
    text.truncate(item.name, 40),
    `${item.approved}`,
    String(item.createdAt),
    String(item.batchSize),
    item.channel,
    text.truncate(item.variant, 40),
    String(item.limit),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultConversionSnapshotViews(items: DefaultConversionSnapshot[]): DefaultConversionSnapshotView[] {
  const views: DefaultConversionSnapshotView[] = [];
  for (const item of items) {
    views.push(toDefaultConversionSnapshotView(item));
  }
  return views;
}

export function sumDefaultConversionSnapshotView(view: DefaultConversionSnapshotView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedCreatedAt + parsedBatchSize + parsedLimit;
}
