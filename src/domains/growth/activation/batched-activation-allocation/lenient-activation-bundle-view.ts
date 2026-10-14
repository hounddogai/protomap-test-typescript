import { LenientActivationBundle } from "./lenient-activation-bundle.js";

/** How screens and exports show a lenient activation bundle. */
export class LenientActivationBundleView {
  code: string;
  labelText: string;
  sendAtText: string;
  impressions: string;
  unit: string;
  capacity: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sendAtText: string,
    impressions: string,
    unit: string,
    capacity: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sendAtText = sendAtText;
    this.impressions = impressions;
    this.unit = unit;
    this.capacity = capacity;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toLenientActivationBundleView(item: LenientActivationBundle): LenientActivationBundleView {
  return new LenientActivationBundleView(
    item.code,
    item.label,
    String(item.sendAt),
    String(item.impressions),
    item.unit,
    String(item.capacity),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientActivationBundleViews(items: LenientActivationBundle[]): LenientActivationBundleView[] {
  const views: LenientActivationBundleView[] = [];
  for (const item of items) {
    views.push(toLenientActivationBundleView(item));
  }
  return views;
}

export function sumLenientActivationBundleView(view: LenientActivationBundleView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedSendAt + parsedImpressions + parsedCapacity;
}
