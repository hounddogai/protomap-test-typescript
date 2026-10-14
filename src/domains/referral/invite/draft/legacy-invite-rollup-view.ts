import * as text from "../../../../kit/text.js";
import { LegacyInviteRollup } from "./legacy-invite-rollup.js";

/** How screens and exports show a legacy invite rollup. */
export class LegacyInviteRollupView {
  code: string;
  title: string;
  impressions: string;
  threshold: string;
  windowDaysText: string;
  audienceId: string;
  labelText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    impressions: string,
    threshold: string,
    windowDaysText: string,
    audienceId: string,
    labelText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.threshold = threshold;
    this.windowDaysText = windowDaysText;
    this.audienceId = audienceId;
    this.labelText = labelText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInviteRollupView(item: LegacyInviteRollup): LegacyInviteRollupView {
  return new LegacyInviteRollupView(
    text.truncate(item.code, 40),
    item.title,
    String(item.impressions),
    item.threshold.toFixed(2),
    String(item.windowDays),
    item.audienceId,
    item.label,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInviteRollupViews(items: LegacyInviteRollup[]): LegacyInviteRollupView[] {
  const views: LegacyInviteRollupView[] = [];
  for (const item of items) {
    views.push(toLegacyInviteRollupView(item));
  }
  return views;
}

export function sumLegacyInviteRollupView(view: LegacyInviteRollupView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedImpressions + parsedThreshold + parsedWindowDays;
}
