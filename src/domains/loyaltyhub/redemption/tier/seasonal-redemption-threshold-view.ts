import * as text from "../../../../kit/text.js";
import { SeasonalRedemptionThreshold } from "./seasonal-redemption-threshold.js";

/** How screens and exports show a seasonal redemption threshold. */
export class SeasonalRedemptionThresholdView {
  codeText: string;
  name: string;
  floorValue: string;
  utmSource: string;
  cost: string;
  timezoneText: string;
  source: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    floorValue: string,
    utmSource: string,
    cost: string,
    timezoneText: string,
    source: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.cost = cost;
    this.timezoneText = timezoneText;
    this.source = source;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRedemptionThresholdView(item: SeasonalRedemptionThreshold): SeasonalRedemptionThresholdView {
  return new SeasonalRedemptionThresholdView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    item.utmSource,
    item.cost.toFixed(2),
    item.timezone,
    text.truncate(item.source, 120),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRedemptionThresholdViews(items: SeasonalRedemptionThreshold[]): SeasonalRedemptionThresholdView[] {
  const views: SeasonalRedemptionThresholdView[] = [];
  for (const item of items) {
    views.push(toSeasonalRedemptionThresholdView(item));
  }
  return views;
}

export function sumSeasonalRedemptionThresholdView(view: SeasonalRedemptionThresholdView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedFloorValue + parsedCost + parsedVersion;
}
