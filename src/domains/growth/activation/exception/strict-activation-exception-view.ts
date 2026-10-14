import * as text from "../../../../kit/text.js";
import { StrictActivationException } from "./strict-activation-exception.js";

/** How screens and exports show a strict activation exception. */
export class StrictActivationExceptionView {
  code: string;
  name: string;
  archived: string;
  activeText: string;
  timezone: string;
  maximumText: string;
  startsAt: string;
  limit: string;
  clicks: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    activeText: string,
    timezone: string,
    maximumText: string,
    startsAt: string,
    limit: string,
    clicks: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.activeText = activeText;
    this.timezone = timezone;
    this.maximumText = maximumText;
    this.startsAt = startsAt;
    this.limit = limit;
    this.clicks = clicks;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toStrictActivationExceptionView(item: StrictActivationException): StrictActivationExceptionView {
  return new StrictActivationExceptionView(
    item.code,
    item.name,
    `${item.archived}`,
    `${item.active}`,
    text.truncate(item.timezone, 120),
    item.maximum.toFixed(2),
    String(item.startsAt),
    String(item.limit),
    String(item.clicks),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictActivationExceptionViews(items: StrictActivationException[]): StrictActivationExceptionView[] {
  const views: StrictActivationExceptionView[] = [];
  for (const item of items) {
    views.push(toStrictActivationExceptionView(item));
  }
  return views;
}

export function sumStrictActivationExceptionView(view: StrictActivationExceptionView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMaximum + parsedStartsAt + parsedLimit;
}
