import * as text from "../../../../kit/text.js";
import { WeightedFlightVariance } from "./weighted-flight-variance.js";

/** How screens and exports show a weighted flight variance. */
export class WeightedFlightVarianceView {
  code: string;
  title: string;
  startsAt: string;
  region: string;
  category: string;
  floorValue: string;
  score: string;
  limit: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    region: string,
    category: string,
    floorValue: string,
    score: string,
    limit: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.region = region;
    this.category = category;
    this.floorValue = floorValue;
    this.score = score;
    this.limit = limit;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFlightVarianceView(item: WeightedFlightVariance): WeightedFlightVarianceView {
  return new WeightedFlightVarianceView(
    item.code,
    item.title,
    String(item.startsAt),
    item.region,
    text.truncate(item.category, 40),
    item.floorValue.toFixed(2),
    item.score.toFixed(2),
    String(item.limit),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFlightVarianceViews(items: WeightedFlightVariance[]): WeightedFlightVarianceView[] {
  const views: WeightedFlightVarianceView[] = [];
  for (const item of items) {
    views.push(toWeightedFlightVarianceView(item));
  }
  return views;
}

export function sumWeightedFlightVarianceView(view: WeightedFlightVarianceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedStartsAt + parsedFloorValue + parsedScore;
}
