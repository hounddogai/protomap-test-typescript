import { BidRuleForecast } from "./bid-rule-forecast.js";

/** How screens and exports show a bid rule forecast. */
export class BidRuleForecastView {
  codeText: string;
  name: string;
  marginText: string;
  minimum: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    marginText: string,
    minimum: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.marginText = marginText;
    this.minimum = minimum;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleForecastView(item: BidRuleForecast): BidRuleForecastView {
  return new BidRuleForecastView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleForecastViews(items: BidRuleForecast[]): BidRuleForecastView[] {
  const views: BidRuleForecastView[] = [];
  for (const item of items) {
    views.push(toBidRuleForecastView(item));
  }
  return views;
}

export function sumBidRuleForecastView(view: BidRuleForecastView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedMargin + parsedMinimum + parsedSequence;
}
