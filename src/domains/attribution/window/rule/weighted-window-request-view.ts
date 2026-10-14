import * as text from "../../../../kit/text.js";
import { WeightedWindowRequest } from "./weighted-window-request.js";

/** How screens and exports show a weighted window request. */
export class WeightedWindowRequestView {
  code: string;
  title: string;
  minimum: string;
  country: string;
  bid: string;
  source: string;
  active: string;
  frequencyCap: string;
  rateText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimum: string,
    country: string,
    bid: string,
    source: string,
    active: string,
    frequencyCap: string,
    rateText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.country = country;
    this.bid = bid;
    this.source = source;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.rateText = rateText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWindowRequestView(item: WeightedWindowRequest): WeightedWindowRequestView {
  return new WeightedWindowRequestView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    item.country,
    item.bid.toFixed(2),
    text.truncate(item.source, 120),
    `${item.active}`,
    String(item.frequencyCap),
    item.rate.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWindowRequestViews(items: WeightedWindowRequest[]): WeightedWindowRequestView[] {
  const views: WeightedWindowRequestView[] = [];
  for (const item of items) {
    views.push(toWeightedWindowRequestView(item));
  }
  return views;
}

export function sumWeightedWindowRequestView(view: WeightedWindowRequestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedMinimum + parsedBid + parsedFrequencyCap;
}
