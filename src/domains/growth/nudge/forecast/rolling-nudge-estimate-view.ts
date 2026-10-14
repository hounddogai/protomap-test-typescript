import { RollingNudgeEstimate } from "./rolling-nudge-estimate.js";

/** How screens and exports show a rolling nudge estimate. */
export class RollingNudgeEstimateView {
  code: string;
  label: string;
  amountText: string;
  floorValueText: string;
  phone: string;
  rate: string;
  openRateText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amountText: string,
    floorValueText: string,
    phone: string,
    rate: string,
    openRateText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amountText = amountText;
    this.floorValueText = floorValueText;
    this.phone = phone;
    this.rate = rate;
    this.openRateText = openRateText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeEstimateView(item: RollingNudgeEstimate): RollingNudgeEstimateView {
  return new RollingNudgeEstimateView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    item.floorValue.toFixed(2),
    item.phone,
    item.rate.toFixed(2),
    item.openRate.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeEstimateViews(items: RollingNudgeEstimate[]): RollingNudgeEstimateView[] {
  const views: RollingNudgeEstimateView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeEstimateView(item));
  }
  return views;
}

export function sumRollingNudgeEstimateView(view: RollingNudgeEstimateView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedAmount + parsedFloorValue + parsedRate;
}
