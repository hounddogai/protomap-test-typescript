import * as text from "../../../../kit/text.js";
import { TouchpointClaim } from "./touchpoint-claim.js";

/** How screens and exports show a touchpoint claim. */
export class TouchpointClaimView {
  code: string;
  label: string;
  regionText: string;
  currency: string;
  unit: string;
  threshold: string;
  quantity: string;
  channel: string;
  utmSource: string;
  checksum: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    regionText: string,
    currency: string,
    unit: string,
    threshold: string,
    quantity: string,
    channel: string,
    utmSource: string,
    checksum: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.regionText = regionText;
    this.currency = currency;
    this.unit = unit;
    this.threshold = threshold;
    this.quantity = quantity;
    this.channel = channel;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointClaimView(item: TouchpointClaim): TouchpointClaimView {
  return new TouchpointClaimView(
    item.code,
    text.truncate(item.label, 64),
    item.region,
    item.currency,
    item.unit,
    item.threshold.toFixed(2),
    String(item.quantity),
    item.channel,
    item.utmSource,
    text.truncate(item.checksum, 80),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointClaimViews(items: TouchpointClaim[]): TouchpointClaimView[] {
  const views: TouchpointClaimView[] = [];
  for (const item of items) {
    views.push(toTouchpointClaimView(item));
  }
  return views;
}

export function sumTouchpointClaimView(view: TouchpointClaimView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedThreshold + parsedQuantity + parsedCeiling;
}
