import * as text from "../../../../kit/text.js";
import { PreferenceSchedule } from "./preference-schedule.js";

/** How screens and exports show a preference schedule. */
export class PreferenceScheduleView {
  code: string;
  titleText: string;
  updatedAtText: string;
  limitText: string;
  notes: string;
  active: string;
  localeText: string;
  openRate: string;
  cohortText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAtText: string,
    limitText: string,
    notes: string,
    active: string,
    localeText: string,
    openRate: string,
    cohortText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAtText = updatedAtText;
    this.limitText = limitText;
    this.notes = notes;
    this.active = active;
    this.localeText = localeText;
    this.openRate = openRate;
    this.cohortText = cohortText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceScheduleView(item: PreferenceSchedule): PreferenceScheduleView {
  return new PreferenceScheduleView(
    item.code,
    text.truncate(item.title, 64),
    String(item.updatedAt),
    String(item.limit),
    item.notes,
    `${item.active}`,
    item.locale,
    item.openRate.toFixed(2),
    text.truncate(item.cohort, 80),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceScheduleViews(items: PreferenceSchedule[]): PreferenceScheduleView[] {
  const views: PreferenceScheduleView[] = [];
  for (const item of items) {
    views.push(toPreferenceScheduleView(item));
  }
  return views;
}

export function sumPreferenceScheduleView(view: PreferenceScheduleView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedUpdatedAt + parsedLimit + parsedOpenRate;
}
