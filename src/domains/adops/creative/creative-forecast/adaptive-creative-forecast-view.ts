import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

/** How screens and exports show a adaptive creative forecast. */
export class AdaptiveCreativeForecastView {
  code: string;
  name: string;
  retriesText: string;
  phoneText: string;
  amountText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retriesText: string,
    phoneText: string,
    amountText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retriesText = retriesText;
    this.phoneText = phoneText;
    this.amountText = amountText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreativeForecastView(item: AdaptiveCreativeForecast): AdaptiveCreativeForecastView {
  return new AdaptiveCreativeForecastView(
    item.code,
    text.truncate(item.name, 80),
    String(item.retries),
    item.phone,
    item.amount.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreativeForecastViews(items: AdaptiveCreativeForecast[]): AdaptiveCreativeForecastView[] {
  const views: AdaptiveCreativeForecastView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreativeForecastView(item));
  }
  return views;
}

export function sumAdaptiveCreativeForecastView(view: AdaptiveCreativeForecastView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedRetries + parsedAmount;
}
