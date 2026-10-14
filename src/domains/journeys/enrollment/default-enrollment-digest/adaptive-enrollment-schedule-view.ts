import { AdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

/** How screens and exports show a adaptive enrollment schedule. */
export class AdaptiveEnrollmentScheduleView {
  code: string;
  name: string;
  graceDays: string;
  marginText: string;
  active: string;
  batchSizeText: string;
  channelText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    marginText: string,
    active: string,
    batchSizeText: string,
    channelText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.marginText = marginText;
    this.active = active;
    this.batchSizeText = batchSizeText;
    this.channelText = channelText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveEnrollmentScheduleView(item: AdaptiveEnrollmentSchedule): AdaptiveEnrollmentScheduleView {
  return new AdaptiveEnrollmentScheduleView(
    item.code,
    item.name,
    String(item.graceDays),
    item.margin.toFixed(2),
    `${item.active}`,
    String(item.batchSize),
    item.channel,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveEnrollmentScheduleViews(items: AdaptiveEnrollmentSchedule[]): AdaptiveEnrollmentScheduleView[] {
  const views: AdaptiveEnrollmentScheduleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveEnrollmentScheduleView(item));
  }
  return views;
}

export function sumAdaptiveEnrollmentScheduleView(view: AdaptiveEnrollmentScheduleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedGraceDays + parsedMargin + parsedBatchSize;
}
