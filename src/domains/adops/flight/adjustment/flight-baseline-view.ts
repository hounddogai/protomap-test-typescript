import * as text from "../../../../kit/text.js";
import { FlightBaseline } from "./flight-baseline.js";

/** How screens and exports show a flight baseline. */
export class FlightBaselineView {
  code: string;
  name: string;
  titleText: string;
  audienceId: string;
  ratioText: string;
  campaignRef: string;
  margin: string;
  rateText: string;
  score: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    titleText: string,
    audienceId: string,
    ratioText: string,
    campaignRef: string,
    margin: string,
    rateText: string,
    score: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.campaignRef = campaignRef;
    this.margin = margin;
    this.rateText = rateText;
    this.score = score;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toFlightBaselineView(item: FlightBaseline): FlightBaselineView {
  return new FlightBaselineView(
    item.code,
    item.name,
    item.title,
    text.truncate(item.audienceId, 40),
    item.ratio.toFixed(2),
    item.campaignRef,
    item.margin.toFixed(2),
    item.rate.toFixed(2),
    item.score.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightBaselineViews(items: FlightBaseline[]): FlightBaselineView[] {
  const views: FlightBaselineView[] = [];
  for (const item of items) {
    views.push(toFlightBaselineView(item));
  }
  return views;
}

export function sumFlightBaselineView(view: FlightBaselineView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRatio + parsedMargin + parsedRate;
}
