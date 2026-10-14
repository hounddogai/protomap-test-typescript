import { TieredCreativeManifest } from "./tiered-creative-manifest.js";

/** How screens and exports show a tiered creative manifest. */
export class TieredCreativeManifestView {
  code: string;
  titleText: string;
  maximum: string;
  startsAt: string;
  durationMinutes: string;
  windowDays: string;
  retries: string;
  contactEmail: string;
  discount: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    maximum: string,
    startsAt: string,
    durationMinutes: string,
    windowDays: string,
    retries: string,
    contactEmail: string,
    discount: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.discount = discount;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCreativeManifestView(item: TieredCreativeManifest): TieredCreativeManifestView {
  return new TieredCreativeManifestView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    String(item.startsAt),
    String(item.durationMinutes),
    String(item.windowDays),
    String(item.retries),
    item.contactEmail,
    item.discount.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCreativeManifestViews(items: TieredCreativeManifest[]): TieredCreativeManifestView[] {
  const views: TieredCreativeManifestView[] = [];
  for (const item of items) {
    views.push(toTieredCreativeManifestView(item));
  }
  return views;
}

export function sumTieredCreativeManifestView(view: TieredCreativeManifestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMaximum + parsedStartsAt + parsedDurationMinutes;
}
