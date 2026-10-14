import * as text from "../../../../kit/text.js";
import { TieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

/** How screens and exports show a tiered bid rule bundle. */
export class TieredBidRuleBundleView {
  code: string;
  name: string;
  floorValue: string;
  localeText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    localeText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.localeText = localeText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBidRuleBundleView(item: TieredBidRuleBundle): TieredBidRuleBundleView {
  return new TieredBidRuleBundleView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.floorValue.toFixed(2),
    item.locale,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBidRuleBundleViews(items: TieredBidRuleBundle[]): TieredBidRuleBundleView[] {
  const views: TieredBidRuleBundleView[] = [];
  for (const item of items) {
    views.push(toTieredBidRuleBundleView(item));
  }
  return views;
}

export function sumTieredBidRuleBundleView(view: TieredBidRuleBundleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedFloorValue + parsedStartsAt;
}
