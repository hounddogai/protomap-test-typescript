import * as text from "../../../../kit/text.js";
import { SeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

/** How screens and exports show a seasonal wait schedule. */
export class SeasonalWaitScheduleView {
  code: string;
  title: string;
  sequence: string;
  segment: string;
  description: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sequence: string,
    segment: string,
    description: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.segment = segment;
    this.description = description;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalWaitScheduleView(item: SeasonalWaitSchedule): SeasonalWaitScheduleView {
  return new SeasonalWaitScheduleView(
    text.truncate(item.code, 120),
    item.title,
    String(item.sequence),
    item.segment,
    item.description,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalWaitScheduleViews(items: SeasonalWaitSchedule[]): SeasonalWaitScheduleView[] {
  const views: SeasonalWaitScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalWaitScheduleView(item));
  }
  return views;
}

export function sumSeasonalWaitScheduleView(view: SeasonalWaitScheduleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSequence + parsedUpdatedAt;
}
