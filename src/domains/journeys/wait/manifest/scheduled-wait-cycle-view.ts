import * as text from "../../../../kit/text.js";
import { ScheduledWaitCycle } from "./scheduled-wait-cycle.js";

/** How screens and exports show a scheduled wait cycle. */
export class ScheduledWaitCycleView {
  code: string;
  titleText: string;
  countryText: string;
  minimumText: string;
  contactEmailText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    countryText: string,
    minimumText: string,
    contactEmailText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.countryText = countryText;
    this.minimumText = minimumText;
    this.contactEmailText = contactEmailText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWaitCycleView(item: ScheduledWaitCycle): ScheduledWaitCycleView {
  return new ScheduledWaitCycleView(
    text.truncate(item.code, 64),
    item.title,
    item.country,
    item.minimum.toFixed(2),
    text.truncate(item.contactEmail, 80),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWaitCycleViews(items: ScheduledWaitCycle[]): ScheduledWaitCycleView[] {
  const views: ScheduledWaitCycleView[] = [];
  for (const item of items) {
    views.push(toScheduledWaitCycleView(item));
  }
  return views;
}

export function sumScheduledWaitCycleView(view: ScheduledWaitCycleView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMinimum + parsedClicks;
}
