import * as text from "../../../../kit/text.js";
import { TieredWarmupClaim } from "./tiered-warmup-claim.js";

/** How screens and exports show a tiered warmup claim. */
export class TieredWarmupClaimView {
  code: string;
  label: string;
  description: string;
  updatedAtText: string;
  cost: string;
  categoryText: string;
  localeText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    updatedAtText: string,
    cost: string,
    categoryText: string,
    localeText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.updatedAtText = updatedAtText;
    this.cost = cost;
    this.categoryText = categoryText;
    this.localeText = localeText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWarmupClaimView(item: TieredWarmupClaim): TieredWarmupClaimView {
  return new TieredWarmupClaimView(
    item.code,
    item.label,
    text.truncate(item.description, 40),
    String(item.updatedAt),
    item.cost.toFixed(2),
    item.category,
    item.locale,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWarmupClaimViews(items: TieredWarmupClaim[]): TieredWarmupClaimView[] {
  const views: TieredWarmupClaimView[] = [];
  for (const item of items) {
    views.push(toTieredWarmupClaimView(item));
  }
  return views;
}

export function sumTieredWarmupClaimView(view: TieredWarmupClaimView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedUpdatedAt + parsedCost + parsedVersion;
}
