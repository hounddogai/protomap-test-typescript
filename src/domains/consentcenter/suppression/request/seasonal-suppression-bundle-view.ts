import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

/** How screens and exports show a seasonal suppression bundle. */
export class SeasonalSuppressionBundleView {
  code: string;
  label: string;
  segment: string;
  costText: string;
  weight: string;
  pinnedText: string;
  rate: string;
  margin: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    costText: string,
    weight: string,
    pinnedText: string,
    rate: string,
    margin: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.costText = costText;
    this.weight = weight;
    this.pinnedText = pinnedText;
    this.rate = rate;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSuppressionBundleView(item: SeasonalSuppressionBundle): SeasonalSuppressionBundleView {
  return new SeasonalSuppressionBundleView(
    item.code,
    text.truncate(item.label, 40),
    item.segment,
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    `${item.pinned}`,
    item.rate.toFixed(2),
    item.margin.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSuppressionBundleViews(items: SeasonalSuppressionBundle[]): SeasonalSuppressionBundleView[] {
  const views: SeasonalSuppressionBundleView[] = [];
  for (const item of items) {
    views.push(toSeasonalSuppressionBundleView(item));
  }
  return views;
}

export function sumSeasonalSuppressionBundleView(view: SeasonalSuppressionBundleView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCost + parsedWeight + parsedRate;
}
