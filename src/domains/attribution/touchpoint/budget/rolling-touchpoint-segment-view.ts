import * as text from "../../../../kit/text.js";
import { RollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

/** How screens and exports show a rolling touchpoint segment. */
export class RollingTouchpointSegmentView {
  codeText: string;
  nameText: string;
  threshold: string;
  updatedAt: string;
  timezone: string;
  country: string;
  unit: string;
  bidText: string;
  category: string;
  channel: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    threshold: string,
    updatedAt: string,
    timezone: string,
    country: string,
    unit: string,
    bidText: string,
    category: string,
    channel: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.country = country;
    this.unit = unit;
    this.bidText = bidText;
    this.category = category;
    this.channel = channel;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toRollingTouchpointSegmentView(item: RollingTouchpointSegment): RollingTouchpointSegmentView {
  return new RollingTouchpointSegmentView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.updatedAt),
    item.timezone,
    item.country,
    text.truncate(item.unit, 40),
    item.bid.toFixed(2),
    item.category,
    item.channel,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingTouchpointSegmentViews(items: RollingTouchpointSegment[]): RollingTouchpointSegmentView[] {
  const views: RollingTouchpointSegmentView[] = [];
  for (const item of items) {
    views.push(toRollingTouchpointSegmentView(item));
  }
  return views;
}

export function sumRollingTouchpointSegmentView(view: RollingTouchpointSegmentView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedThreshold + parsedUpdatedAt + parsedBid;
}
