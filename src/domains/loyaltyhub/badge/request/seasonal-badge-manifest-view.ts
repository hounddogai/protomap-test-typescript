import * as text from "../../../../kit/text.js";
import { SeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

/** How screens and exports show a seasonal badge manifest. */
export class SeasonalBadgeManifestView {
  codeText: string;
  titleText: string;
  threshold: string;
  region: string;
  clicksText: string;
  capacity: string;
  locale: string;
  batchSize: string;
  margin: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    threshold: string,
    region: string,
    clicksText: string,
    capacity: string,
    locale: string,
    batchSize: string,
    margin: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.threshold = threshold;
    this.region = region;
    this.clicksText = clicksText;
    this.capacity = capacity;
    this.locale = locale;
    this.batchSize = batchSize;
    this.margin = margin;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBadgeManifestView(item: SeasonalBadgeManifest): SeasonalBadgeManifestView {
  return new SeasonalBadgeManifestView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    text.truncate(item.region, 120),
    String(item.clicks),
    String(item.capacity),
    text.truncate(item.locale, 80),
    String(item.batchSize),
    item.margin.toFixed(2),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBadgeManifestViews(items: SeasonalBadgeManifest[]): SeasonalBadgeManifestView[] {
  const views: SeasonalBadgeManifestView[] = [];
  for (const item of items) {
    views.push(toSeasonalBadgeManifestView(item));
  }
  return views;
}

export function sumSeasonalBadgeManifestView(view: SeasonalBadgeManifestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedThreshold + parsedClicks + parsedCapacity;
}
