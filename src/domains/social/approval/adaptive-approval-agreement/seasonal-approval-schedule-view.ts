import * as text from "../../../../kit/text.js";
import { SeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

/** How screens and exports show a seasonal approval schedule. */
export class SeasonalApprovalScheduleView {
  code: string;
  labelText: string;
  locale: string;
  ownerId: string;
  bid: string;
  reviewer: string;
  conversionRateText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    ownerId: string,
    bid: string,
    reviewer: string,
    conversionRateText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.ownerId = ownerId;
    this.bid = bid;
    this.reviewer = reviewer;
    this.conversionRateText = conversionRateText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalApprovalScheduleView(item: SeasonalApprovalSchedule): SeasonalApprovalScheduleView {
  return new SeasonalApprovalScheduleView(
    text.truncate(item.code, 64),
    item.label,
    item.locale,
    item.ownerId,
    item.bid.toFixed(2),
    item.reviewer,
    item.conversionRate.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalApprovalScheduleViews(items: SeasonalApprovalSchedule[]): SeasonalApprovalScheduleView[] {
  const views: SeasonalApprovalScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalApprovalScheduleView(item));
  }
  return views;
}

export function sumSeasonalApprovalScheduleView(view: SeasonalApprovalScheduleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedBid + parsedConversionRate + parsedFloorValue;
}
