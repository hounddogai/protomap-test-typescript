import * as text from "../../../../kit/text.js";
import { PreferenceRollup } from "./preference-rollup.js";

/** How screens and exports show a preference rollup. */
export class PreferenceRollupView {
  codeText: string;
  name: string;
  campaignRef: string;
  timezone: string;
  floorValue: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    campaignRef: string,
    timezone: string,
    floorValue: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceRollupView(item: PreferenceRollup): PreferenceRollupView {
  return new PreferenceRollupView(
    item.code,
    item.name,
    text.truncate(item.campaignRef, 120),
    text.truncate(item.timezone, 64),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceRollupViews(items: PreferenceRollup[]): PreferenceRollupView[] {
  const views: PreferenceRollupView[] = [];
  for (const item of items) {
    views.push(toPreferenceRollupView(item));
  }
  return views;
}

export function sumPreferenceRollupView(view: PreferenceRollupView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFloorValue + parsedExpiresAt;
}
