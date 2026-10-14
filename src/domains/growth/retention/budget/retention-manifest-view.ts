import { RetentionManifest } from "./retention-manifest.js";

/** How screens and exports show a retention manifest. */
export class RetentionManifestView {
  code: string;
  labelText: string;
  campaignRef: string;
  unit: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    campaignRef: string,
    unit: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionManifestView(item: RetentionManifest): RetentionManifestView {
  return new RetentionManifestView(
    item.code,
    item.label,
    item.campaignRef,
    item.unit,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionManifestViews(items: RetentionManifest[]): RetentionManifestView[] {
  const views: RetentionManifestView[] = [];
  for (const item of items) {
    views.push(toRetentionManifestView(item));
  }
  return views;
}

export function sumRetentionManifestView(view: RetentionManifestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
