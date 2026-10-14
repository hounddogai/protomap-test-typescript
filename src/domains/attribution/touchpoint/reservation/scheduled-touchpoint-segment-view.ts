import { ScheduledTouchpointSegment } from "./scheduled-touchpoint-segment.js";

/** How screens and exports show a scheduled touchpoint segment. */
export class ScheduledTouchpointSegmentView {
  code: string;
  title: string;
  cost: string;
  timezone: string;
  minimum: string;
  region: string;
  clicks: string;
  visible: string;
  endsAtText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cost: string,
    timezone: string,
    minimum: string,
    region: string,
    clicks: string,
    visible: string,
    endsAtText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.timezone = timezone;
    this.minimum = minimum;
    this.region = region;
    this.clicks = clicks;
    this.visible = visible;
    this.endsAtText = endsAtText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledTouchpointSegmentView(item: ScheduledTouchpointSegment): ScheduledTouchpointSegmentView {
  return new ScheduledTouchpointSegmentView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.timezone,
    item.minimum.toFixed(2),
    item.region,
    String(item.clicks),
    `${item.visible}`,
    String(item.endsAt),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledTouchpointSegmentViews(items: ScheduledTouchpointSegment[]): ScheduledTouchpointSegmentView[] {
  const views: ScheduledTouchpointSegmentView[] = [];
  for (const item of items) {
    views.push(toScheduledTouchpointSegmentView(item));
  }
  return views;
}

export function sumScheduledTouchpointSegmentView(view: ScheduledTouchpointSegmentView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedCost + parsedMinimum + parsedClicks;
}
