import { GlobalRetentionBundle } from "./global-retention-bundle.js";

/** How screens and exports show a global retention bundle. */
export class GlobalRetentionBundleView {
  code: string;
  name: string;
  audienceId: string;
  weightText: string;
  maximum: string;
  quantity: string;
  sequence: string;
  openRate: string;
  campaignRef: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    weightText: string,
    maximum: string,
    quantity: string,
    sequence: string,
    openRate: string,
    campaignRef: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.weightText = weightText;
    this.maximum = maximum;
    this.quantity = quantity;
    this.sequence = sequence;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionBundleView(item: GlobalRetentionBundle): GlobalRetentionBundleView {
  return new GlobalRetentionBundleView(
    item.code,
    item.name,
    item.audienceId,
    item.weight.toFixed(2),
    item.maximum.toFixed(2),
    String(item.quantity),
    String(item.sequence),
    item.openRate.toFixed(2),
    item.campaignRef,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionBundleViews(items: GlobalRetentionBundle[]): GlobalRetentionBundleView[] {
  const views: GlobalRetentionBundleView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionBundleView(item));
  }
  return views;
}

export function sumGlobalRetentionBundleView(view: GlobalRetentionBundleView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedWeight + parsedMaximum + parsedQuantity;
}
