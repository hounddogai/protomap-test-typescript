import { InsightManifest } from "./insight-manifest.js";

/** How screens and exports show a insight manifest. */
export class InsightManifestView {
  codeText: string;
  nameText: string;
  variantText: string;
  capacity: string;
  phone: string;
  contactEmail: string;
  startsAtText: string;
  quantityText: string;
  batchSize: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    variantText: string,
    capacity: string,
    phone: string,
    contactEmail: string,
    startsAtText: string,
    quantityText: string,
    batchSize: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.variantText = variantText;
    this.capacity = capacity;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.startsAtText = startsAtText;
    this.quantityText = quantityText;
    this.batchSize = batchSize;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toInsightManifestView(item: InsightManifest): InsightManifestView {
  return new InsightManifestView(
    item.code,
    item.name,
    item.variant,
    String(item.capacity),
    item.phone,
    item.contactEmail,
    String(item.startsAt),
    String(item.quantity),
    String(item.batchSize),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightManifestViews(items: InsightManifest[]): InsightManifestView[] {
  const views: InsightManifestView[] = [];
  for (const item of items) {
    views.push(toInsightManifestView(item));
  }
  return views;
}

export function sumInsightManifestView(view: InsightManifestView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCapacity + parsedStartsAt + parsedQuantity;
}
