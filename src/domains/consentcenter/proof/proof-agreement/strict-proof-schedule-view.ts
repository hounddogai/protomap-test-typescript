import * as text from "../../../../kit/text.js";
import { StrictProofSchedule } from "./strict-proof-schedule.js";

/** How screens and exports show a strict proof schedule. */
export class StrictProofScheduleView {
  code: string;
  label: string;
  region: string;
  active: string;
  channel: string;
  categoryText: string;
  openRate: string;
  margin: string;
  conversionRate: string;
  campaignRef: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    region: string,
    active: string,
    channel: string,
    categoryText: string,
    openRate: string,
    margin: string,
    conversionRate: string,
    campaignRef: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.active = active;
    this.channel = channel;
    this.categoryText = categoryText;
    this.openRate = openRate;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toStrictProofScheduleView(item: StrictProofSchedule): StrictProofScheduleView {
  return new StrictProofScheduleView(
    item.code,
    item.label,
    text.truncate(item.region, 40),
    `${item.active}`,
    text.truncate(item.channel, 80),
    text.truncate(item.category, 64),
    item.openRate.toFixed(2),
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    item.campaignRef,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictProofScheduleViews(items: StrictProofSchedule[]): StrictProofScheduleView[] {
  const views: StrictProofScheduleView[] = [];
  for (const item of items) {
    views.push(toStrictProofScheduleView(item));
  }
  return views;
}

export function sumStrictProofScheduleView(view: StrictProofScheduleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedOpenRate + parsedMargin + parsedConversionRate;
}
