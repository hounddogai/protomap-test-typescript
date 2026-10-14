import * as text from "../../../../kit/text.js";
import { TouchpointBatch } from "./touchpoint-batch.js";

/** How screens and exports show a touchpoint batch. */
export class TouchpointBatchView {
  code: string;
  title: string;
  expiresAtText: string;
  category: string;
  conversionRate: string;
  ratio: string;
  checksum: string;
  batchSize: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAtText: string,
    category: string,
    conversionRate: string,
    ratio: string,
    checksum: string,
    batchSize: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.category = category;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointBatchView(item: TouchpointBatch): TouchpointBatchView {
  return new TouchpointBatchView(
    item.code,
    item.title,
    String(item.expiresAt),
    text.truncate(item.category, 80),
    item.conversionRate.toFixed(2),
    item.ratio.toFixed(2),
    item.checksum,
    String(item.batchSize),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointBatchViews(items: TouchpointBatch[]): TouchpointBatchView[] {
  const views: TouchpointBatchView[] = [];
  for (const item of items) {
    views.push(toTouchpointBatchView(item));
  }
  return views;
}

export function sumTouchpointBatchView(view: TouchpointBatchView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedExpiresAt + parsedConversionRate + parsedRatio;
}
