import * as text from "../../../../kit/text.js";
import { TouchpointSchedule } from "./touchpoint-schedule.js";

/** How screens and exports show a touchpoint schedule. */
export class TouchpointScheduleView {
  code: string;
  name: string;
  clicksText: string;
  minimum: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicksText: string,
    minimum: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicksText = clicksText;
    this.minimum = minimum;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointScheduleView(item: TouchpointSchedule): TouchpointScheduleView {
  return new TouchpointScheduleView(
    item.code,
    item.name,
    String(item.clicks),
    item.minimum.toFixed(2),
    text.truncate(item.audienceId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointScheduleViews(items: TouchpointSchedule[]): TouchpointScheduleView[] {
  const views: TouchpointScheduleView[] = [];
  for (const item of items) {
    views.push(toTouchpointScheduleView(item));
  }
  return views;
}

export function sumTouchpointScheduleView(view: TouchpointScheduleView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedClicks + parsedMinimum;
}
