import * as text from "../../../../kit/text.js";
import { SeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

/** How screens and exports show a seasonal escalation schedule. */
export class SeasonalEscalationScheduleView {
  codeText: string;
  name: string;
  rate: string;
  clicks: string;
  minimum: string;
  region: string;
  title: string;
  startsAt: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    rate: string,
    clicks: string,
    minimum: string,
    region: string,
    title: string,
    startsAt: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.rate = rate;
    this.clicks = clicks;
    this.minimum = minimum;
    this.region = region;
    this.title = title;
    this.startsAt = startsAt;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalEscalationScheduleView(item: SeasonalEscalationSchedule): SeasonalEscalationScheduleView {
  return new SeasonalEscalationScheduleView(
    item.code,
    text.truncate(item.name, 64),
    item.rate.toFixed(2),
    String(item.clicks),
    item.minimum.toFixed(2),
    text.truncate(item.region, 64),
    item.title,
    String(item.startsAt),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalEscalationScheduleViews(items: SeasonalEscalationSchedule[]): SeasonalEscalationScheduleView[] {
  const views: SeasonalEscalationScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalEscalationScheduleView(item));
  }
  return views;
}

export function sumSeasonalEscalationScheduleView(view: SeasonalEscalationScheduleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRate + parsedClicks + parsedMinimum;
}
