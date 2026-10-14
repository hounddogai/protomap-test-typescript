import { PacingSummary } from "./pacing-summary.js";

/** How screens and exports show a pacing summary. */
export class PacingSummaryView {
  code: string;
  name: string;
  capacity: string;
  countryText: string;
  checksum: string;
  windowDaysText: string;
  maximum: string;
  description: string;
  costText: string;
  channel: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    countryText: string,
    checksum: string,
    windowDaysText: string,
    maximum: string,
    description: string,
    costText: string,
    channel: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.countryText = countryText;
    this.checksum = checksum;
    this.windowDaysText = windowDaysText;
    this.maximum = maximum;
    this.description = description;
    this.costText = costText;
    this.channel = channel;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPacingSummaryView(item: PacingSummary): PacingSummaryView {
  return new PacingSummaryView(
    item.code,
    item.name,
    String(item.capacity),
    item.country,
    item.checksum,
    String(item.windowDays),
    item.maximum.toFixed(2),
    item.description,
    item.cost.toFixed(2),
    item.channel,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingSummaryViews(items: PacingSummary[]): PacingSummaryView[] {
  const views: PacingSummaryView[] = [];
  for (const item of items) {
    views.push(toPacingSummaryView(item));
  }
  return views;
}

export function sumPacingSummaryView(view: PacingSummaryView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCapacity + parsedWindowDays + parsedMaximum;
}
