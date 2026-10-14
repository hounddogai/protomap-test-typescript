import * as text from "../../../../kit/text.js";
import { DomainSchedule } from "./domain-schedule.js";

/** How screens and exports show a domain schedule. */
export class DomainScheduleView {
  codeText: string;
  labelText: string;
  utmSource: string;
  localeText: string;
  channelText: string;
  descriptionText: string;
  endsAt: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    utmSource: string,
    localeText: string,
    channelText: string,
    descriptionText: string,
    endsAt: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.utmSource = utmSource;
    this.localeText = localeText;
    this.channelText = channelText;
    this.descriptionText = descriptionText;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toDomainScheduleView(item: DomainSchedule): DomainScheduleView {
  return new DomainScheduleView(
    item.code,
    item.label,
    item.utmSource,
    text.truncate(item.locale, 120),
    text.truncate(item.channel, 120),
    item.description,
    String(item.endsAt),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainScheduleViews(items: DomainSchedule[]): DomainScheduleView[] {
  const views: DomainScheduleView[] = [];
  for (const item of items) {
    views.push(toDomainScheduleView(item));
  }
  return views;
}

export function sumDomainScheduleView(view: DomainScheduleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedEndsAt + parsedMaximum;
}
