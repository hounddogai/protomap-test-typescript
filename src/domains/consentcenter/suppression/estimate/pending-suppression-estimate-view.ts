import * as text from "../../../../kit/text.js";
import { PendingSuppressionEstimate } from "./pending-suppression-estimate.js";

/** How screens and exports show a pending suppression estimate. */
export class PendingSuppressionEstimateView {
  code: string;
  nameText: string;
  budget: string;
  sendAtText: string;
  externalRef: string;
  timezoneText: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    sendAtText: string,
    externalRef: string,
    timezoneText: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.sendAtText = sendAtText;
    this.externalRef = externalRef;
    this.timezoneText = timezoneText;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSuppressionEstimateView(item: PendingSuppressionEstimate): PendingSuppressionEstimateView {
  return new PendingSuppressionEstimateView(
    text.truncate(item.code, 80),
    item.name,
    item.budget.toFixed(2),
    String(item.sendAt),
    item.externalRef,
    item.timezone,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSuppressionEstimateViews(items: PendingSuppressionEstimate[]): PendingSuppressionEstimateView[] {
  const views: PendingSuppressionEstimateView[] = [];
  for (const item of items) {
    views.push(toPendingSuppressionEstimateView(item));
  }
  return views;
}

export function sumPendingSuppressionEstimateView(view: PendingSuppressionEstimateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedBudget + parsedSendAt + parsedConversionRate;
}
