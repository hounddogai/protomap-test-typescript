import * as text from "../../../../kit/text.js";
import { WeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

/** How screens and exports show a weighted preference baseline. */
export class WeightedPreferenceBaselineView {
  code: string;
  name: string;
  startsAt: string;
  openRateText: string;
  floorValueText: string;
  score: string;
  pinned: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    openRateText: string,
    floorValueText: string,
    score: string,
    pinned: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.openRateText = openRateText;
    this.floorValueText = floorValueText;
    this.score = score;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPreferenceBaselineView(item: WeightedPreferenceBaseline): WeightedPreferenceBaselineView {
  return new WeightedPreferenceBaselineView(
    text.truncate(item.code, 64),
    item.name,
    String(item.startsAt),
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    item.score.toFixed(2),
    `${item.pinned}`,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPreferenceBaselineViews(items: WeightedPreferenceBaseline[]): WeightedPreferenceBaselineView[] {
  const views: WeightedPreferenceBaselineView[] = [];
  for (const item of items) {
    views.push(toWeightedPreferenceBaselineView(item));
  }
  return views;
}

export function sumWeightedPreferenceBaselineView(view: WeightedPreferenceBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedStartsAt + parsedOpenRate + parsedFloorValue;
}
