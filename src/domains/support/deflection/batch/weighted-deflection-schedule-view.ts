import * as text from "../../../../kit/text.js";
import { WeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

/** How screens and exports show a weighted deflection schedule. */
export class WeightedDeflectionScheduleView {
  code: string;
  title: string;
  amount: string;
  graceDaysText: string;
  impressions: string;
  phone: string;
  openRate: string;
  capacityText: string;
  journeyIdText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    graceDaysText: string,
    impressions: string,
    phone: string,
    openRate: string,
    capacityText: string,
    journeyIdText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.graceDaysText = graceDaysText;
    this.impressions = impressions;
    this.phone = phone;
    this.openRate = openRate;
    this.capacityText = capacityText;
    this.journeyIdText = journeyIdText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDeflectionScheduleView(item: WeightedDeflectionSchedule): WeightedDeflectionScheduleView {
  return new WeightedDeflectionScheduleView(
    text.truncate(item.code, 120),
    item.title,
    item.amount.toFixed(2),
    String(item.graceDays),
    String(item.impressions),
    item.phone,
    item.openRate.toFixed(2),
    String(item.capacity),
    text.truncate(item.journeyId, 80),
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDeflectionScheduleViews(items: WeightedDeflectionSchedule[]): WeightedDeflectionScheduleView[] {
  const views: WeightedDeflectionScheduleView[] = [];
  for (const item of items) {
    views.push(toWeightedDeflectionScheduleView(item));
  }
  return views;
}

export function sumWeightedDeflectionScheduleView(view: WeightedDeflectionScheduleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedAmount + parsedGraceDays + parsedImpressions;
}
