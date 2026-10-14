import * as text from "../../../../kit/text.js";
import { PlacementPreference } from "./placement-preference.js";

/** How screens and exports show a placement preference. */
export class PlacementPreferenceView {
  code: string;
  name: string;
  reviewer: string;
  openRate: string;
  utmSource: string;
  minimum: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    openRate: string,
    utmSource: string,
    minimum: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementPreferenceView(item: PlacementPreference): PlacementPreferenceView {
  return new PlacementPreferenceView(
    item.code,
    text.truncate(item.name, 40),
    item.reviewer,
    item.openRate.toFixed(2),
    item.utmSource,
    item.minimum.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementPreferenceViews(items: PlacementPreference[]): PlacementPreferenceView[] {
  const views: PlacementPreferenceView[] = [];
  for (const item of items) {
    views.push(toPlacementPreferenceView(item));
  }
  return views;
}

export function sumPlacementPreferenceView(view: PlacementPreferenceView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedOpenRate + parsedMinimum;
}
