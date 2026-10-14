import * as text from "../../../../kit/text.js";
import { FunnelSchedule } from "./funnel-schedule.js";

/** How screens and exports show a funnel schedule. */
export class FunnelScheduleView {
  codeText: string;
  title: string;
  utmSourceText: string;
  countryText: string;
  graceDays: string;
  clicksText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    utmSourceText: string,
    countryText: string,
    graceDays: string,
    clicksText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.countryText = countryText;
    this.graceDays = graceDays;
    this.clicksText = clicksText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelScheduleView(item: FunnelSchedule): FunnelScheduleView {
  return new FunnelScheduleView(
    item.code,
    text.truncate(item.title, 120),
    item.utmSource,
    item.country,
    String(item.graceDays),
    String(item.clicks),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelScheduleViews(items: FunnelSchedule[]): FunnelScheduleView[] {
  const views: FunnelScheduleView[] = [];
  for (const item of items) {
    views.push(toFunnelScheduleView(item));
  }
  return views;
}

export function sumFunnelScheduleView(view: FunnelScheduleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedGraceDays + parsedClicks + parsedFloorValue;
}
