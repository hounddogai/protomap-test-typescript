import { FrequencyBatch } from "./frequency-batch.js";

/** How screens and exports show a frequency batch. */
export class FrequencyBatchView {
  codeText: string;
  label: string;
  campaignRef: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRef: string,
    ownerId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyBatchView(item: FrequencyBatch): FrequencyBatchView {
  return new FrequencyBatchView(
    item.code,
    item.label,
    item.campaignRef,
    item.ownerId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyBatchViews(items: FrequencyBatch[]): FrequencyBatchView[] {
  const views: FrequencyBatchView[] = [];
  for (const item of items) {
    views.push(toFrequencyBatchView(item));
  }
  return views;
}

export function sumFrequencyBatchView(view: FrequencyBatchView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
