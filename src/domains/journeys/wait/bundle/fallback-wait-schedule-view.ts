import * as text from "../../../../kit/text.js";
import { FallbackWaitSchedule } from "./fallback-wait-schedule.js";

/** How screens and exports show a fallback wait schedule. */
export class FallbackWaitScheduleView {
  code: string;
  name: string;
  version: string;
  channelText: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    channelText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.channelText = channelText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackWaitScheduleView(item: FallbackWaitSchedule): FallbackWaitScheduleView {
  return new FallbackWaitScheduleView(
    item.code,
    text.truncate(item.name, 120),
    String(item.version),
    text.truncate(item.channel, 120),
    text.truncate(item.notes, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackWaitScheduleViews(items: FallbackWaitSchedule[]): FallbackWaitScheduleView[] {
  const views: FallbackWaitScheduleView[] = [];
  for (const item of items) {
    views.push(toFallbackWaitScheduleView(item));
  }
  return views;
}

export function sumFallbackWaitScheduleView(view: FallbackWaitScheduleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
