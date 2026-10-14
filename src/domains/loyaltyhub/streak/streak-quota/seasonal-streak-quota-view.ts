import * as text from "../../../../kit/text.js";
import { SeasonalStreakQuota } from "./seasonal-streak-quota.js";

/** How screens and exports show a seasonal streak quota. */
export class SeasonalStreakQuotaView {
  code: string;
  label: string;
  segment: string;
  maximumText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    maximumText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.maximumText = maximumText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalStreakQuotaView(item: SeasonalStreakQuota): SeasonalStreakQuotaView {
  return new SeasonalStreakQuotaView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.segment, 80),
    item.maximum.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalStreakQuotaViews(items: SeasonalStreakQuota[]): SeasonalStreakQuotaView[] {
  const views: SeasonalStreakQuotaView[] = [];
  for (const item of items) {
    views.push(toSeasonalStreakQuotaView(item));
  }
  return views;
}

export function sumSeasonalStreakQuotaView(view: SeasonalStreakQuotaView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMaximum + parsedImpressions;
}
