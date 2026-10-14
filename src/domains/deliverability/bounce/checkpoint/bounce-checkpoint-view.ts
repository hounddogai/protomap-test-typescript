import { BounceCheckpoint } from "./bounce-checkpoint.js";

/** How screens and exports show a bounce checkpoint. */
export class BounceCheckpointView {
  code: string;
  label: string;
  impressions: string;
  campaignRef: string;
  quantity: string;
  threshold: string;
  graceDays: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    campaignRef: string,
    quantity: string,
    threshold: string,
    graceDays: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceCheckpointView(item: BounceCheckpoint): BounceCheckpointView {
  return new BounceCheckpointView(
    item.code,
    item.label,
    String(item.impressions),
    item.campaignRef,
    String(item.quantity),
    item.threshold.toFixed(2),
    String(item.graceDays),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceCheckpointViews(items: BounceCheckpoint[]): BounceCheckpointView[] {
  const views: BounceCheckpointView[] = [];
  for (const item of items) {
    views.push(toBounceCheckpointView(item));
  }
  return views;
}

export function sumBounceCheckpointView(view: BounceCheckpointView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedImpressions + parsedQuantity + parsedThreshold;
}
