import * as text from "../../../../kit/text.js";
import { TieredPacingRequest } from "./tiered-pacing-request.js";

/** How screens and exports show a tiered pacing request. */
export class TieredPacingRequestView {
  codeText: string;
  name: string;
  budgetText: string;
  timezoneText: string;
  durationMinutesText: string;
  amountText: string;
  impressions: string;
  discountText: string;
  sendAtText: string;
  cohortText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budgetText: string,
    timezoneText: string,
    durationMinutesText: string,
    amountText: string,
    impressions: string,
    discountText: string,
    sendAtText: string,
    cohortText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budgetText = budgetText;
    this.timezoneText = timezoneText;
    this.durationMinutesText = durationMinutesText;
    this.amountText = amountText;
    this.impressions = impressions;
    this.discountText = discountText;
    this.sendAtText = sendAtText;
    this.cohortText = cohortText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPacingRequestView(item: TieredPacingRequest): TieredPacingRequestView {
  return new TieredPacingRequestView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    text.truncate(item.timezone, 80),
    String(item.durationMinutes),
    item.amount.toFixed(2),
    String(item.impressions),
    item.discount.toFixed(2),
    String(item.sendAt),
    item.cohort,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPacingRequestViews(items: TieredPacingRequest[]): TieredPacingRequestView[] {
  const views: TieredPacingRequestView[] = [];
  for (const item of items) {
    views.push(toTieredPacingRequestView(item));
  }
  return views;
}

export function sumTieredPacingRequestView(view: TieredPacingRequestView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedBudget + parsedDurationMinutes + parsedAmount;
}
