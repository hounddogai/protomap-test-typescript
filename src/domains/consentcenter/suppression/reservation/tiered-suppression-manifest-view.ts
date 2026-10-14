import { TieredSuppressionManifest } from "./tiered-suppression-manifest.js";

/** How screens and exports show a tiered suppression manifest. */
export class TieredSuppressionManifestView {
  code: string;
  titleText: string;
  nameText: string;
  description: string;
  ceiling: string;
  priorityText: string;
  expiresAtText: string;
  discountText: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    nameText: string,
    description: string,
    ceiling: string,
    priorityText: string,
    expiresAtText: string,
    discountText: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.nameText = nameText;
    this.description = description;
    this.ceiling = ceiling;
    this.priorityText = priorityText;
    this.expiresAtText = expiresAtText;
    this.discountText = discountText;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSuppressionManifestView(item: TieredSuppressionManifest): TieredSuppressionManifestView {
  return new TieredSuppressionManifestView(
    item.code,
    item.title,
    item.name,
    item.description,
    item.ceiling.toFixed(2),
    String(item.priority),
    String(item.expiresAt),
    item.discount.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSuppressionManifestViews(items: TieredSuppressionManifest[]): TieredSuppressionManifestView[] {
  const views: TieredSuppressionManifestView[] = [];
  for (const item of items) {
    views.push(toTieredSuppressionManifestView(item));
  }
  return views;
}

export function sumTieredSuppressionManifestView(view: TieredSuppressionManifestView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedCeiling + parsedPriority + parsedExpiresAt;
}
