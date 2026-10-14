import * as text from "../../../../kit/text.js";
import { RollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

/** How screens and exports show a rolling bid rule profile. */
export class RollingBidRuleProfileView {
  code: string;
  labelText: string;
  floorValueText: string;
  timezone: string;
  statusLabel: string;

  constructor(code: string, labelText: string, floorValueText: string, timezone: string, statusLabel: string) {
    this.code = code;
    this.labelText = labelText;
    this.floorValueText = floorValueText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBidRuleProfileView(item: RollingBidRuleProfile): RollingBidRuleProfileView {
  return new RollingBidRuleProfileView(
    text.truncate(item.code, 80),
    item.label,
    item.floorValue.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBidRuleProfileViews(items: RollingBidRuleProfile[]): RollingBidRuleProfileView[] {
  const views: RollingBidRuleProfileView[] = [];
  for (const item of items) {
    views.push(toRollingBidRuleProfileView(item));
  }
  return views;
}

export function sumRollingBidRuleProfileView(view: RollingBidRuleProfileView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedFloorValue;
}
