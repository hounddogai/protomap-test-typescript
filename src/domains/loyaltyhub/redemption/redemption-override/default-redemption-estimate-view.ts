import { DefaultRedemptionEstimate } from "./default-redemption-estimate.js";

/** How screens and exports show a default redemption estimate. */
export class DefaultRedemptionEstimateView {
  codeText: string;
  titleText: string;
  floorValue: string;
  name: string;
  windowDaysText: string;
  amountText: string;
  clicks: string;
  budgetText: string;
  unit: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    floorValue: string,
    name: string,
    windowDaysText: string,
    amountText: string,
    clicks: string,
    budgetText: string,
    unit: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.floorValue = floorValue;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.amountText = amountText;
    this.clicks = clicks;
    this.budgetText = budgetText;
    this.unit = unit;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRedemptionEstimateView(item: DefaultRedemptionEstimate): DefaultRedemptionEstimateView {
  return new DefaultRedemptionEstimateView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    item.name,
    String(item.windowDays),
    item.amount.toFixed(2),
    String(item.clicks),
    item.budget.toFixed(2),
    item.unit,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRedemptionEstimateViews(items: DefaultRedemptionEstimate[]): DefaultRedemptionEstimateView[] {
  const views: DefaultRedemptionEstimateView[] = [];
  for (const item of items) {
    views.push(toDefaultRedemptionEstimateView(item));
  }
  return views;
}

export function sumDefaultRedemptionEstimateView(view: DefaultRedemptionEstimateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedFloorValue + parsedWindowDays + parsedAmount;
}
