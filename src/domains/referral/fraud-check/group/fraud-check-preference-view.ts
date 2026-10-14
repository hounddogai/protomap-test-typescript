import * as text from "../../../../kit/text.js";
import { FraudCheckPreference } from "./fraud-check-preference.js";

/** How screens and exports show a fraud check preference. */
export class FraudCheckPreferenceView {
  code: string;
  nameText: string;
  timezone: string;
  segmentText: string;
  cost: string;
  rateText: string;
  updatedAtText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    timezone: string,
    segmentText: string,
    cost: string,
    rateText: string,
    updatedAtText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.timezone = timezone;
    this.segmentText = segmentText;
    this.cost = cost;
    this.rateText = rateText;
    this.updatedAtText = updatedAtText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckPreferenceView(item: FraudCheckPreference): FraudCheckPreferenceView {
  return new FraudCheckPreferenceView(
    item.code,
    item.name,
    item.timezone,
    text.truncate(item.segment, 40),
    item.cost.toFixed(2),
    item.rate.toFixed(2),
    String(item.updatedAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckPreferenceViews(items: FraudCheckPreference[]): FraudCheckPreferenceView[] {
  const views: FraudCheckPreferenceView[] = [];
  for (const item of items) {
    views.push(toFraudCheckPreferenceView(item));
  }
  return views;
}

export function sumFraudCheckPreferenceView(view: FraudCheckPreferenceView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedCost + parsedRate + parsedUpdatedAt;
}
