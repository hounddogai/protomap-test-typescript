import { GlobalStreakBundle } from "./global-streak-bundle.js";

/** How screens and exports show a global streak bundle. */
export class GlobalStreakBundleView {
  codeText: string;
  label: string;
  floorValue: string;
  scoreText: string;
  ownerIdText: string;
  graceDays: string;
  region: string;
  cohort: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    floorValue: string,
    scoreText: string,
    ownerIdText: string,
    graceDays: string,
    region: string,
    cohort: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.floorValue = floorValue;
    this.scoreText = scoreText;
    this.ownerIdText = ownerIdText;
    this.graceDays = graceDays;
    this.region = region;
    this.cohort = cohort;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalStreakBundleView(item: GlobalStreakBundle): GlobalStreakBundleView {
  return new GlobalStreakBundleView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.score.toFixed(2),
    item.ownerId,
    String(item.graceDays),
    item.region,
    item.cohort,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalStreakBundleViews(items: GlobalStreakBundle[]): GlobalStreakBundleView[] {
  const views: GlobalStreakBundleView[] = [];
  for (const item of items) {
    views.push(toGlobalStreakBundleView(item));
  }
  return views;
}

export function sumGlobalStreakBundleView(view: GlobalStreakBundleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedFloorValue + parsedScore + parsedGraceDays;
}
