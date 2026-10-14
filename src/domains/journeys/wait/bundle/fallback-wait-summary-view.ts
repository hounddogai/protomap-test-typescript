import * as text from "../../../../kit/text.js";
import { FallbackWaitSummary } from "./fallback-wait-summary.js";

/** How screens and exports show a fallback wait summary. */
export class FallbackWaitSummaryView {
  code: string;
  title: string;
  timezone: string;
  pinned: string;
  scoreText: string;
  countryText: string;
  floorValueText: string;
  openRate: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    pinned: string,
    scoreText: string,
    countryText: string,
    floorValueText: string,
    openRate: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.pinned = pinned;
    this.scoreText = scoreText;
    this.countryText = countryText;
    this.floorValueText = floorValueText;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackWaitSummaryView(item: FallbackWaitSummary): FallbackWaitSummaryView {
  return new FallbackWaitSummaryView(
    item.code,
    item.title,
    text.truncate(item.timezone, 80),
    `${item.pinned}`,
    item.score.toFixed(2),
    item.country,
    item.floorValue.toFixed(2),
    item.openRate.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackWaitSummaryViews(items: FallbackWaitSummary[]): FallbackWaitSummaryView[] {
  const views: FallbackWaitSummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackWaitSummaryView(item));
  }
  return views;
}

export function sumFallbackWaitSummaryView(view: FallbackWaitSummaryView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedScore + parsedFloorValue + parsedOpenRate;
}
