import * as text from "../../../../kit/text.js";
import { FunnelManifest } from "./funnel-manifest.js";

/** How screens and exports show a funnel manifest. */
export class FunnelManifestView {
  code: string;
  label: string;
  summary: string;
  region: string;
  quantityText: string;
  floorValueText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    region: string,
    quantityText: string,
    floorValueText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.region = region;
    this.quantityText = quantityText;
    this.floorValueText = floorValueText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelManifestView(item: FunnelManifest): FunnelManifestView {
  return new FunnelManifestView(
    item.code,
    item.label,
    item.summary,
    text.truncate(item.region, 80),
    String(item.quantity),
    item.floorValue.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelManifestViews(items: FunnelManifest[]): FunnelManifestView[] {
  const views: FunnelManifestView[] = [];
  for (const item of items) {
    views.push(toFunnelManifestView(item));
  }
  return views;
}

export function sumFunnelManifestView(view: FunnelManifestView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedQuantity + parsedFloorValue;
}
