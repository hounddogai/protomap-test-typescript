import * as text from "../../../../kit/text.js";
import { SeasonalPacingProfile } from "./seasonal-pacing-profile.js";

/** How screens and exports show a seasonal pacing profile. */
export class SeasonalPacingProfileView {
  code: string;
  titleText: string;
  campaignRefText: string;
  ceiling: string;
  sequence: string;
  score: string;
  rate: string;
  version: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    campaignRefText: string,
    ceiling: string,
    sequence: string,
    score: string,
    rate: string,
    version: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.campaignRefText = campaignRefText;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.score = score;
    this.rate = rate;
    this.version = version;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPacingProfileView(item: SeasonalPacingProfile): SeasonalPacingProfileView {
  return new SeasonalPacingProfileView(
    item.code,
    text.truncate(item.title, 40),
    item.campaignRef,
    item.ceiling.toFixed(2),
    String(item.sequence),
    item.score.toFixed(2),
    item.rate.toFixed(2),
    String(item.version),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPacingProfileViews(items: SeasonalPacingProfile[]): SeasonalPacingProfileView[] {
  const views: SeasonalPacingProfileView[] = [];
  for (const item of items) {
    views.push(toSeasonalPacingProfileView(item));
  }
  return views;
}

export function sumSeasonalPacingProfileView(view: SeasonalPacingProfileView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedCeiling + parsedSequence + parsedScore;
}
