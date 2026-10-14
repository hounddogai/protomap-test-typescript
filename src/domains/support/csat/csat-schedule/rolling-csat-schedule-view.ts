import * as text from "../../../../kit/text.js";
import { RollingCsatSchedule } from "./rolling-csat-schedule.js";

/** How screens and exports show a rolling csat schedule. */
export class RollingCsatScheduleView {
  codeText: string;
  nameText: string;
  audienceIdText: string;
  unit: string;
  revision: string;
  maximum: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    audienceIdText: string,
    unit: string,
    revision: string,
    maximum: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.audienceIdText = audienceIdText;
    this.unit = unit;
    this.revision = revision;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCsatScheduleView(item: RollingCsatSchedule): RollingCsatScheduleView {
  return new RollingCsatScheduleView(
    item.code,
    text.truncate(item.name, 40),
    item.audienceId,
    item.unit,
    String(item.revision),
    item.maximum.toFixed(2),
    text.truncate(item.ownerId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCsatScheduleViews(items: RollingCsatSchedule[]): RollingCsatScheduleView[] {
  const views: RollingCsatScheduleView[] = [];
  for (const item of items) {
    views.push(toRollingCsatScheduleView(item));
  }
  return views;
}

export function sumRollingCsatScheduleView(view: RollingCsatScheduleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRevision + parsedMaximum;
}
