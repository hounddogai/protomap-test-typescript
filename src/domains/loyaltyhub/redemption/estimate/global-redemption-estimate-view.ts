import { GlobalRedemptionEstimate } from "./global-redemption-estimate.js";

/** How screens and exports show a global redemption estimate. */
export class GlobalRedemptionEstimateView {
  codeText: string;
  name: string;
  ratio: string;
  channel: string;
  country: string;
  conversionRateText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratio: string,
    channel: string,
    country: string,
    conversionRateText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratio = ratio;
    this.channel = channel;
    this.country = country;
    this.conversionRateText = conversionRateText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRedemptionEstimateView(item: GlobalRedemptionEstimate): GlobalRedemptionEstimateView {
  return new GlobalRedemptionEstimateView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    item.channel,
    item.country,
    item.conversionRate.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRedemptionEstimateViews(items: GlobalRedemptionEstimate[]): GlobalRedemptionEstimateView[] {
  const views: GlobalRedemptionEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalRedemptionEstimateView(item));
  }
  return views;
}

export function sumGlobalRedemptionEstimateView(view: GlobalRedemptionEstimateView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedRatio + parsedConversionRate;
}
