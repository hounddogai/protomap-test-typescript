import * as text from "../../../../kit/text.js";
import { TieredPostSchedule } from "./tiered-post-schedule.js";

/** How screens and exports show a tiered post schedule. */
export class TieredPostScheduleView {
  code: string;
  name: string;
  startsAt: string;
  summary: string;
  margin: string;
  version: string;
  source: string;
  label: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    summary: string,
    margin: string,
    version: string,
    source: string,
    label: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.summary = summary;
    this.margin = margin;
    this.version = version;
    this.source = source;
    this.label = label;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPostScheduleView(item: TieredPostSchedule): TieredPostScheduleView {
  return new TieredPostScheduleView(
    item.code,
    item.name,
    String(item.startsAt),
    item.summary,
    item.margin.toFixed(2),
    String(item.version),
    item.source,
    item.label,
    text.truncate(item.cohort, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPostScheduleViews(items: TieredPostSchedule[]): TieredPostScheduleView[] {
  const views: TieredPostScheduleView[] = [];
  for (const item of items) {
    views.push(toTieredPostScheduleView(item));
  }
  return views;
}

export function sumTieredPostScheduleView(view: TieredPostScheduleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedStartsAt + parsedMargin + parsedVersion;
}
