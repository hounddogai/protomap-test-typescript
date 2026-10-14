import * as text from "../../../../kit/text.js";
import { SeasonalDeflectionManifest } from "./seasonal-deflection-manifest.js";

/** How screens and exports show a seasonal deflection manifest. */
export class SeasonalDeflectionManifestView {
  code: string;
  title: string;
  endsAt: string;
  ownerId: string;
  graceDaysText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    ownerId: string,
    graceDaysText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.graceDaysText = graceDaysText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDeflectionManifestView(item: SeasonalDeflectionManifest): SeasonalDeflectionManifestView {
  return new SeasonalDeflectionManifestView(
    item.code,
    item.title,
    String(item.endsAt),
    text.truncate(item.ownerId, 120),
    String(item.graceDays),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDeflectionManifestViews(items: SeasonalDeflectionManifest[]): SeasonalDeflectionManifestView[] {
  const views: SeasonalDeflectionManifestView[] = [];
  for (const item of items) {
    views.push(toSeasonalDeflectionManifestView(item));
  }
  return views;
}

export function sumSeasonalDeflectionManifestView(view: SeasonalDeflectionManifestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedEndsAt + parsedGraceDays + parsedOpenRate;
}
