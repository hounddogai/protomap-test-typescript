import * as text from "../../../../kit/text.js";
import { PrimaryPlacementTier } from "./primary-placement-tier.js";

/** How screens and exports show a primary placement tier. */
export class PrimaryPlacementTierView {
  code: string;
  title: string;
  batchSize: string;
  variant: string;
  retriesText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    variant: string,
    retriesText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.variant = variant;
    this.retriesText = retriesText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPlacementTierView(item: PrimaryPlacementTier): PrimaryPlacementTierView {
  return new PrimaryPlacementTierView(
    item.code,
    item.title,
    String(item.batchSize),
    text.truncate(item.variant, 120),
    String(item.retries),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPlacementTierViews(items: PrimaryPlacementTier[]): PrimaryPlacementTierView[] {
  const views: PrimaryPlacementTierView[] = [];
  for (const item of items) {
    views.push(toPrimaryPlacementTierView(item));
  }
  return views;
}

export function sumPrimaryPlacementTierView(view: PrimaryPlacementTierView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBatchSize + parsedRetries + parsedDurationMinutes;
}
