import * as text from "../../../../kit/text.js";
import { PathEstimate } from "./path-estimate.js";

/** How screens and exports show a path estimate. */
export class PathEstimateView {
  code: string;
  title: string;
  bid: string;
  timezone: string;
  durationMinutes: string;
  endsAt: string;
  startsAt: string;
  impressions: string;
  ceiling: string;
  cohortText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    timezone: string,
    durationMinutes: string,
    endsAt: string,
    startsAt: string,
    impressions: string,
    ceiling: string,
    cohortText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.cohortText = cohortText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPathEstimateView(item: PathEstimate): PathEstimateView {
  return new PathEstimateView(
    item.code,
    text.truncate(item.title, 64),
    item.bid.toFixed(2),
    item.timezone,
    String(item.durationMinutes),
    String(item.endsAt),
    String(item.startsAt),
    String(item.impressions),
    item.ceiling.toFixed(2),
    item.cohort,
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathEstimateViews(items: PathEstimate[]): PathEstimateView[] {
  const views: PathEstimateView[] = [];
  for (const item of items) {
    views.push(toPathEstimateView(item));
  }
  return views;
}

export function sumPathEstimateView(view: PathEstimateView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedEndsAt;
}
