import * as text from "../../../../kit/text.js";
import { GlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

/** How screens and exports show a global subscription estimate. */
export class GlobalSubscriptionEstimateView {
  code: string;
  name: string;
  expiresAt: string;
  campaignRef: string;
  source: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    campaignRef: string,
    source: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.source = source;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSubscriptionEstimateView(item: GlobalSubscriptionEstimate): GlobalSubscriptionEstimateView {
  return new GlobalSubscriptionEstimateView(
    item.code,
    text.truncate(item.name, 64),
    String(item.expiresAt),
    item.campaignRef,
    item.source,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSubscriptionEstimateViews(items: GlobalSubscriptionEstimate[]): GlobalSubscriptionEstimateView[] {
  const views: GlobalSubscriptionEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalSubscriptionEstimateView(item));
  }
  return views;
}

export function sumGlobalSubscriptionEstimateView(view: GlobalSubscriptionEstimateView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedExpiresAt + parsedConversionRate;
}
