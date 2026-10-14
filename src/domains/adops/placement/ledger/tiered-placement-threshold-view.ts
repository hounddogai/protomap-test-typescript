import { TieredPlacementThreshold } from "./tiered-placement-threshold.js";

/** How screens and exports show a tiered placement threshold. */
export class TieredPlacementThresholdView {
  code: string;
  name: string;
  amount: string;
  utmSource: string;
  description: string;
  active: string;
  title: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    amount: string,
    utmSource: string,
    description: string,
    active: string,
    title: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.utmSource = utmSource;
    this.description = description;
    this.active = active;
    this.title = title;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPlacementThresholdView(item: TieredPlacementThreshold): TieredPlacementThresholdView {
  return new TieredPlacementThresholdView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    item.utmSource,
    item.description,
    `${item.active}`,
    item.title,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPlacementThresholdViews(items: TieredPlacementThreshold[]): TieredPlacementThresholdView[] {
  const views: TieredPlacementThresholdView[] = [];
  for (const item of items) {
    views.push(toTieredPlacementThresholdView(item));
  }
  return views;
}

export function sumTieredPlacementThresholdView(view: TieredPlacementThresholdView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
