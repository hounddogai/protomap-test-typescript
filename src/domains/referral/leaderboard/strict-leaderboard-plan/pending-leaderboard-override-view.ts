import * as text from "../../../../kit/text.js";
import { PendingLeaderboardOverride } from "./pending-leaderboard-override.js";

/** How screens and exports show a pending leaderboard override. */
export class PendingLeaderboardOverrideView {
  codeText: string;
  labelText: string;
  archived: string;
  conversionRate: string;
  audienceIdText: string;
  ratio: string;
  durationMinutesText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    archived: string,
    conversionRate: string,
    audienceIdText: string,
    ratio: string,
    durationMinutesText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.audienceIdText = audienceIdText;
    this.ratio = ratio;
    this.durationMinutesText = durationMinutesText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLeaderboardOverrideView(item: PendingLeaderboardOverride): PendingLeaderboardOverrideView {
  return new PendingLeaderboardOverrideView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    `${item.archived}`,
    item.conversionRate.toFixed(2),
    item.audienceId,
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLeaderboardOverrideViews(items: PendingLeaderboardOverride[]): PendingLeaderboardOverrideView[] {
  const views: PendingLeaderboardOverrideView[] = [];
  for (const item of items) {
    views.push(toPendingLeaderboardOverrideView(item));
  }
  return views;
}

export function sumPendingLeaderboardOverrideView(view: PendingLeaderboardOverrideView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedConversionRate + parsedRatio + parsedDurationMinutes;
}
