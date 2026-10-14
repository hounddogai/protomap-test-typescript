import { FrequencyException } from "./frequency-exception.js";

/** How screens and exports show a frequency exception. */
export class FrequencyExceptionView {
  code: string;
  titleText: string;
  graceDays: string;
  floorValueText: string;
  margin: string;
  ceiling: string;
  summary: string;
  country: string;
  durationMinutes: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    graceDays: string,
    floorValueText: string,
    margin: string,
    ceiling: string,
    summary: string,
    country: string,
    durationMinutes: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.graceDays = graceDays;
    this.floorValueText = floorValueText;
    this.margin = margin;
    this.ceiling = ceiling;
    this.summary = summary;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyExceptionView(item: FrequencyException): FrequencyExceptionView {
  return new FrequencyExceptionView(
    item.code,
    item.title,
    String(item.graceDays),
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    item.ceiling.toFixed(2),
    item.summary,
    item.country,
    String(item.durationMinutes),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyExceptionViews(items: FrequencyException[]): FrequencyExceptionView[] {
  const views: FrequencyExceptionView[] = [];
  for (const item of items) {
    views.push(toFrequencyExceptionView(item));
  }
  return views;
}

export function sumFrequencyExceptionView(view: FrequencyExceptionView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedGraceDays + parsedFloorValue + parsedMargin;
}
