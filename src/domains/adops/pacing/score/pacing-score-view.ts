import { PacingScore } from "./pacing-score.js";

/** How screens and exports show a pacing score. */
export class PacingScoreView {
  code: string;
  title: string;
  graceDays: string;
  regionText: string;
  journeyId: string;
  windowDaysText: string;
  bid: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    regionText: string,
    journeyId: string,
    windowDaysText: string,
    bid: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.regionText = regionText;
    this.journeyId = journeyId;
    this.windowDaysText = windowDaysText;
    this.bid = bid;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingScoreView(item: PacingScore): PacingScoreView {
  return new PacingScoreView(
    item.code,
    item.title,
    String(item.graceDays),
    item.region,
    item.journeyId,
    String(item.windowDays),
    item.bid.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingScoreViews(items: PacingScore[]): PacingScoreView[] {
  const views: PacingScoreView[] = [];
  for (const item of items) {
    views.push(toPacingScoreView(item));
  }
  return views;
}

export function sumPacingScoreView(view: PacingScoreView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedGraceDays + parsedWindowDays + parsedBid;
}
