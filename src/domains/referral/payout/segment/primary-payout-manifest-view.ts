import { PrimaryPayoutManifest } from "./primary-payout-manifest.js";

/** How screens and exports show a primary payout manifest. */
export class PrimaryPayoutManifestView {
  code: string;
  name: string;
  unit: string;
  variant: string;
  checksum: string;
  pinned: string;
  score: string;
  locale: string;
  country: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    variant: string,
    checksum: string,
    pinned: string,
    score: string,
    locale: string,
    country: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.variant = variant;
    this.checksum = checksum;
    this.pinned = pinned;
    this.score = score;
    this.locale = locale;
    this.country = country;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPayoutManifestView(item: PrimaryPayoutManifest): PrimaryPayoutManifestView {
  return new PrimaryPayoutManifestView(
    item.code,
    item.name,
    item.unit,
    item.variant,
    item.checksum,
    `${item.pinned}`,
    item.score.toFixed(2),
    item.locale,
    item.country,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPayoutManifestViews(items: PrimaryPayoutManifest[]): PrimaryPayoutManifestView[] {
  const views: PrimaryPayoutManifestView[] = [];
  for (const item of items) {
    views.push(toPrimaryPayoutManifestView(item));
  }
  return views;
}

export function sumPrimaryPayoutManifestView(view: PrimaryPayoutManifestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
