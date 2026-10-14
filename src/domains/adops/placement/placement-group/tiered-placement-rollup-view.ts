import * as text from "../../../../kit/text.js";
import { TieredPlacementRollup } from "./tiered-placement-rollup.js";

/** How screens and exports show a tiered placement rollup. */
export class TieredPlacementRollupView {
  codeText: string;
  nameText: string;
  graceDaysText: string;
  regionText: string;
  minimum: string;
  expiresAt: string;
  attempts: string;
  approvedText: string;
  reviewer: string;
  createdAtText: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    graceDaysText: string,
    regionText: string,
    minimum: string,
    expiresAt: string,
    attempts: string,
    approvedText: string,
    reviewer: string,
    createdAtText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.graceDaysText = graceDaysText;
    this.regionText = regionText;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.approvedText = approvedText;
    this.reviewer = reviewer;
    this.createdAtText = createdAtText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPlacementRollupView(item: TieredPlacementRollup): TieredPlacementRollupView {
  return new TieredPlacementRollupView(
    item.code,
    text.truncate(item.name, 64),
    String(item.graceDays),
    text.truncate(item.region, 80),
    item.minimum.toFixed(2),
    String(item.expiresAt),
    String(item.attempts),
    `${item.approved}`,
    item.reviewer,
    String(item.createdAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPlacementRollupViews(items: TieredPlacementRollup[]): TieredPlacementRollupView[] {
  const views: TieredPlacementRollupView[] = [];
  for (const item of items) {
    views.push(toTieredPlacementRollupView(item));
  }
  return views;
}

export function sumTieredPlacementRollupView(view: TieredPlacementRollupView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedGraceDays + parsedMinimum + parsedExpiresAt;
}
