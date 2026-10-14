import * as text from "../../../../kit/text.js";
import { LenientSlaSchedule } from "./lenient-sla-schedule.js";

/** How screens and exports show a lenient sla schedule. */
export class LenientSlaScheduleView {
  code: string;
  title: string;
  bidText: string;
  campaignRefText: string;
  channel: string;
  reviewerText: string;
  createdAtText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bidText: string,
    campaignRefText: string,
    channel: string,
    reviewerText: string,
    createdAtText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bidText = bidText;
    this.campaignRefText = campaignRefText;
    this.channel = channel;
    this.reviewerText = reviewerText;
    this.createdAtText = createdAtText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSlaScheduleView(item: LenientSlaSchedule): LenientSlaScheduleView {
  return new LenientSlaScheduleView(
    text.truncate(item.code, 80),
    item.title,
    item.bid.toFixed(2),
    item.campaignRef,
    item.channel,
    item.reviewer,
    String(item.createdAt),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSlaScheduleViews(items: LenientSlaSchedule[]): LenientSlaScheduleView[] {
  const views: LenientSlaScheduleView[] = [];
  for (const item of items) {
    views.push(toLenientSlaScheduleView(item));
  }
  return views;
}

export function sumLenientSlaScheduleView(view: LenientSlaScheduleView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBid + parsedCreatedAt + parsedConversionRate;
}
