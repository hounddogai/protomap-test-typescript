import * as text from "../../../../kit/text.js";
import { WeightedPlacementEstimate } from "./weighted-placement-estimate.js";

/** How screens and exports show a weighted placement estimate. */
export class WeightedPlacementEstimateView {
  codeText: string;
  title: string;
  timezone: string;
  startsAt: string;
  minimumText: string;
  journeyId: string;
  expiresAt: string;
  locale: string;
  windowDays: string;
  quantityText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezone: string,
    startsAt: string,
    minimumText: string,
    journeyId: string,
    expiresAt: string,
    locale: string,
    windowDays: string,
    quantityText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.minimumText = minimumText;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.windowDays = windowDays;
    this.quantityText = quantityText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPlacementEstimateView(item: WeightedPlacementEstimate): WeightedPlacementEstimateView {
  return new WeightedPlacementEstimateView(
    item.code,
    text.truncate(item.title, 40),
    item.timezone,
    String(item.startsAt),
    item.minimum.toFixed(2),
    item.journeyId,
    String(item.expiresAt),
    text.truncate(item.locale, 64),
    String(item.windowDays),
    String(item.quantity),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPlacementEstimateViews(items: WeightedPlacementEstimate[]): WeightedPlacementEstimateView[] {
  const views: WeightedPlacementEstimateView[] = [];
  for (const item of items) {
    views.push(toWeightedPlacementEstimateView(item));
  }
  return views;
}

export function sumWeightedPlacementEstimateView(view: WeightedPlacementEstimateView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedStartsAt + parsedMinimum + parsedExpiresAt;
}
