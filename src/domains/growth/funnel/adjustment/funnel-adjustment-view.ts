import { FunnelAdjustment } from "./funnel-adjustment.js";

/** How screens and exports show a funnel adjustment. */
export class FunnelAdjustmentView {
  code: string;
  name: string;
  threshold: string;
  version: string;
  cost: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    version: string,
    cost: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.version = version;
    this.cost = cost;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelAdjustmentView(item: FunnelAdjustment): FunnelAdjustmentView {
  return new FunnelAdjustmentView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.version),
    item.cost.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelAdjustmentViews(items: FunnelAdjustment[]): FunnelAdjustmentView[] {
  const views: FunnelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFunnelAdjustmentView(item));
  }
  return views;
}

export function sumFunnelAdjustmentView(view: FunnelAdjustmentView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedThreshold + parsedVersion + parsedCost;
}
