import * as text from "../../../../kit/text.js";
import { WeightedCsatVariance } from "./weighted-csat-variance.js";

/** How screens and exports show a weighted csat variance. */
export class WeightedCsatVarianceView {
  code: string;
  name: string;
  startsAtText: string;
  batchSize: string;
  revision: string;
  floorValue: string;
  conversionRate: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAtText: string,
    batchSize: string,
    revision: string,
    floorValue: string,
    conversionRate: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAtText = startsAtText;
    this.batchSize = batchSize;
    this.revision = revision;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedCsatVarianceView(item: WeightedCsatVariance): WeightedCsatVarianceView {
  return new WeightedCsatVarianceView(
    item.code,
    text.truncate(item.name, 80),
    String(item.startsAt),
    String(item.batchSize),
    String(item.revision),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.audienceId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedCsatVarianceViews(items: WeightedCsatVariance[]): WeightedCsatVarianceView[] {
  const views: WeightedCsatVarianceView[] = [];
  for (const item of items) {
    views.push(toWeightedCsatVarianceView(item));
  }
  return views;
}

export function sumWeightedCsatVarianceView(view: WeightedCsatVarianceView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedStartsAt + parsedBatchSize + parsedRevision;
}
