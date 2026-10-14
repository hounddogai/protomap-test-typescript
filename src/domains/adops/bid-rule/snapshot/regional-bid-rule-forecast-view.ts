import * as text from "../../../../kit/text.js";
import { RegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

/** How screens and exports show a regional bid rule forecast. */
export class RegionalBidRuleForecastView {
  codeText: string;
  labelText: string;
  quantityText: string;
  channelText: string;
  retries: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    quantityText: string,
    channelText: string,
    retries: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.quantityText = quantityText;
    this.channelText = channelText;
    this.retries = retries;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalBidRuleForecastView(item: RegionalBidRuleForecast): RegionalBidRuleForecastView {
  return new RegionalBidRuleForecastView(
    item.code,
    item.label,
    String(item.quantity),
    text.truncate(item.channel, 64),
    String(item.retries),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalBidRuleForecastViews(items: RegionalBidRuleForecast[]): RegionalBidRuleForecastView[] {
  const views: RegionalBidRuleForecastView[] = [];
  for (const item of items) {
    views.push(toRegionalBidRuleForecastView(item));
  }
  return views;
}

export function sumRegionalBidRuleForecastView(view: RegionalBidRuleForecastView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedQuantity + parsedRetries + parsedSendAt;
}
