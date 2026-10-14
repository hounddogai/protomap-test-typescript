import * as text from "../../../../kit/text.js";
import { DoubleOptInOverride } from "./double-opt-in-override.js";

/** How screens and exports show a double opt in override. */
export class DoubleOptInOverrideView {
  code: string;
  name: string;
  batchSizeText: string;
  maximum: string;
  region: string;
  audienceIdText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    batchSizeText: string,
    maximum: string,
    region: string,
    audienceIdText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.batchSizeText = batchSizeText;
    this.maximum = maximum;
    this.region = region;
    this.audienceIdText = audienceIdText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInOverrideView(item: DoubleOptInOverride): DoubleOptInOverrideView {
  return new DoubleOptInOverrideView(
    item.code,
    text.truncate(item.name, 80),
    String(item.batchSize),
    item.maximum.toFixed(2),
    item.region,
    item.audienceId,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInOverrideViews(items: DoubleOptInOverride[]): DoubleOptInOverrideView[] {
  const views: DoubleOptInOverrideView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInOverrideView(item));
  }
  return views;
}

export function sumDoubleOptInOverrideView(view: DoubleOptInOverrideView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBatchSize + parsedMaximum + parsedStartsAt;
}
