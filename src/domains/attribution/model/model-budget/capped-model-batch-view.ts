import * as text from "../../../../kit/text.js";
import { CappedModelBatch } from "./capped-model-batch.js";

/** How screens and exports show a capped model batch. */
export class CappedModelBatchView {
  code: string;
  nameText: string;
  currencyText: string;
  ratio: string;
  approved: string;
  thresholdText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    currencyText: string,
    ratio: string,
    approved: string,
    thresholdText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.currencyText = currencyText;
    this.ratio = ratio;
    this.approved = approved;
    this.thresholdText = thresholdText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toCappedModelBatchView(item: CappedModelBatch): CappedModelBatchView {
  return new CappedModelBatchView(
    text.truncate(item.code, 64),
    item.name,
    item.currency,
    item.ratio.toFixed(2),
    `${item.approved}`,
    item.threshold.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedModelBatchViews(items: CappedModelBatch[]): CappedModelBatchView[] {
  const views: CappedModelBatchView[] = [];
  for (const item of items) {
    views.push(toCappedModelBatchView(item));
  }
  return views;
}

export function sumCappedModelBatchView(view: CappedModelBatchView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRatio + parsedThreshold + parsedExpiresAt;
}
