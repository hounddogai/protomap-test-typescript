import * as text from "../../../../kit/text.js";
import { WeightedPacingThreshold } from "./weighted-pacing-threshold.js";

/** How screens and exports show a weighted pacing threshold. */
export class WeightedPacingThresholdView {
  code: string;
  title: string;
  bid: string;
  weight: string;
  segment: string;
  frequencyCapText: string;
  retriesText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    weight: string,
    segment: string,
    frequencyCapText: string,
    retriesText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.weight = weight;
    this.segment = segment;
    this.frequencyCapText = frequencyCapText;
    this.retriesText = retriesText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPacingThresholdView(item: WeightedPacingThreshold): WeightedPacingThresholdView {
  return new WeightedPacingThresholdView(
    text.truncate(item.code, 64),
    item.title,
    item.bid.toFixed(2),
    item.weight.toFixed(2),
    item.segment,
    String(item.frequencyCap),
    String(item.retries),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPacingThresholdViews(items: WeightedPacingThreshold[]): WeightedPacingThresholdView[] {
  const views: WeightedPacingThresholdView[] = [];
  for (const item of items) {
    views.push(toWeightedPacingThresholdView(item));
  }
  return views;
}

export function sumWeightedPacingThresholdView(view: WeightedPacingThresholdView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedBid + parsedWeight + parsedFrequencyCap;
}
