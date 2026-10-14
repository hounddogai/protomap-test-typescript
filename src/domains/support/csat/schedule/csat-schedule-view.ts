import * as text from "../../../../kit/text.js";
import { CsatSchedule } from "./csat-schedule.js";

/** How screens and exports show a csat schedule. */
export class CsatScheduleView {
  codeText: string;
  label: string;
  nameText: string;
  minimum: string;
  countryText: string;
  openRateText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    nameText: string,
    minimum: string,
    countryText: string,
    openRateText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.nameText = nameText;
    this.minimum = minimum;
    this.countryText = countryText;
    this.openRateText = openRateText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toCsatScheduleView(item: CsatSchedule): CsatScheduleView {
  return new CsatScheduleView(
    item.code,
    item.label,
    item.name,
    item.minimum.toFixed(2),
    text.truncate(item.country, 64),
    item.openRate.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatScheduleViews(items: CsatSchedule[]): CsatScheduleView[] {
  const views: CsatScheduleView[] = [];
  for (const item of items) {
    views.push(toCsatScheduleView(item));
  }
  return views;
}

export function sumCsatScheduleView(view: CsatScheduleView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedOpenRate + parsedImpressions;
}
