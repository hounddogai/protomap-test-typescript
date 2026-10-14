import * as text from "../../../../kit/text.js";
import { TieredMacroSnapshot } from "./tiered-macro-snapshot.js";

/** How screens and exports show a tiered macro snapshot. */
export class TieredMacroSnapshotView {
  code: string;
  nameText: string;
  title: string;
  threshold: string;
  impressions: string;
  score: string;
  batchSizeText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    title: string,
    threshold: string,
    impressions: string,
    score: string,
    batchSizeText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.title = title;
    this.threshold = threshold;
    this.impressions = impressions;
    this.score = score;
    this.batchSizeText = batchSizeText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredMacroSnapshotView(item: TieredMacroSnapshot): TieredMacroSnapshotView {
  return new TieredMacroSnapshotView(
    item.code,
    text.truncate(item.name, 64),
    item.title,
    item.threshold.toFixed(2),
    String(item.impressions),
    item.score.toFixed(2),
    String(item.batchSize),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredMacroSnapshotViews(items: TieredMacroSnapshot[]): TieredMacroSnapshotView[] {
  const views: TieredMacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredMacroSnapshotView(item));
  }
  return views;
}

export function sumTieredMacroSnapshotView(view: TieredMacroSnapshotView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedThreshold + parsedImpressions + parsedScore;
}
