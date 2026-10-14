import * as text from "../../../../kit/text.js";
import { ProofForecast } from "./proof-forecast.js";

/** How screens and exports show a proof forecast. */
export class ProofForecastView {
  code: string;
  name: string;
  graceDays: string;
  discount: string;
  region: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    discount: string,
    region: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.discount = discount;
    this.region = region;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toProofForecastView(item: ProofForecast): ProofForecastView {
  return new ProofForecastView(
    text.truncate(item.code, 64),
    item.name,
    String(item.graceDays),
    item.discount.toFixed(2),
    item.region,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofForecastViews(items: ProofForecast[]): ProofForecastView[] {
  const views: ProofForecastView[] = [];
  for (const item of items) {
    views.push(toProofForecastView(item));
  }
  return views;
}

export function sumProofForecastView(view: ProofForecastView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedGraceDays + parsedDiscount;
}
