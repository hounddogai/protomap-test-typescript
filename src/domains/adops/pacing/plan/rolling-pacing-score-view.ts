import * as text from "../../../../kit/text.js";
import { RollingPacingScore } from "./rolling-pacing-score.js";

/** How screens and exports show a rolling pacing score. */
export class RollingPacingScoreView {
  code: string;
  name: string;
  clicks: string;
  approved: string;
  active: string;
  attempts: string;
  timezoneText: string;
  description: string;
  impressions: string;
  audienceId: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicks: string,
    approved: string,
    active: string,
    attempts: string,
    timezoneText: string,
    description: string,
    impressions: string,
    audienceId: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.approved = approved;
    this.active = active;
    this.attempts = attempts;
    this.timezoneText = timezoneText;
    this.description = description;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPacingScoreView(item: RollingPacingScore): RollingPacingScoreView {
  return new RollingPacingScoreView(
    item.code,
    item.name,
    String(item.clicks),
    `${item.approved}`,
    `${item.active}`,
    String(item.attempts),
    item.timezone,
    text.truncate(item.description, 64),
    String(item.impressions),
    item.audienceId,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPacingScoreViews(items: RollingPacingScore[]): RollingPacingScoreView[] {
  const views: RollingPacingScoreView[] = [];
  for (const item of items) {
    views.push(toRollingPacingScoreView(item));
  }
  return views;
}

export function sumRollingPacingScoreView(view: RollingPacingScoreView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedClicks + parsedAttempts + parsedImpressions;
}
