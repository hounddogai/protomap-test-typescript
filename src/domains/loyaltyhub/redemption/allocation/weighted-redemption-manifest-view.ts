import * as text from "../../../../kit/text.js";
import { WeightedRedemptionManifest } from "./weighted-redemption-manifest.js";

/** How screens and exports show a weighted redemption manifest. */
export class WeightedRedemptionManifestView {
  code: string;
  label: string;
  pinned: string;
  description: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    description: string,
    ownerId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.description = description;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRedemptionManifestView(item: WeightedRedemptionManifest): WeightedRedemptionManifestView {
  return new WeightedRedemptionManifestView(
    text.truncate(item.code, 40),
    item.label,
    `${item.pinned}`,
    text.truncate(item.description, 40),
    item.ownerId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRedemptionManifestViews(items: WeightedRedemptionManifest[]): WeightedRedemptionManifestView[] {
  const views: WeightedRedemptionManifestView[] = [];
  for (const item of items) {
    views.push(toWeightedRedemptionManifestView(item));
  }
  return views;
}

export function sumWeightedRedemptionManifestView(view: WeightedRedemptionManifestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
