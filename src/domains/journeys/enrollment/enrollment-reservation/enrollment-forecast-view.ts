import * as text from "../../../../kit/text.js";
import { EnrollmentForecast } from "./enrollment-forecast.js";

/** How screens and exports show a enrollment forecast. */
export class EnrollmentForecastView {
  code: string;
  label: string;
  floorValue: string;
  region: string;
  approvedText: string;
  journeyId: string;
  audienceId: string;
  amount: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    region: string,
    approvedText: string,
    journeyId: string,
    audienceId: string,
    amount: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.region = region;
    this.approvedText = approvedText;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.amount = amount;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentForecastView(item: EnrollmentForecast): EnrollmentForecastView {
  return new EnrollmentForecastView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.region,
    `${item.approved}`,
    item.journeyId,
    text.truncate(item.audienceId, 120),
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentForecastViews(items: EnrollmentForecast[]): EnrollmentForecastView[] {
  const views: EnrollmentForecastView[] = [];
  for (const item of items) {
    views.push(toEnrollmentForecastView(item));
  }
  return views;
}

export function sumEnrollmentForecastView(view: EnrollmentForecastView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedFloorValue + parsedAmount + parsedDiscount;
}
