import * as text from "../../../../kit/text.js";
import { InsightCheckpoint } from "./insight-checkpoint.js";

/** How screens and exports show a insight checkpoint. */
export class InsightCheckpointView {
  code: string;
  name: string;
  segment: string;
  rate: string;
  version: string;
  variant: string;
  impressions: string;
  score: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    rate: string,
    version: string,
    variant: string,
    impressions: string,
    score: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.rate = rate;
    this.version = version;
    this.variant = variant;
    this.impressions = impressions;
    this.score = score;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightCheckpointView(item: InsightCheckpoint): InsightCheckpointView {
  return new InsightCheckpointView(
    text.truncate(item.code, 64),
    item.name,
    item.segment,
    item.rate.toFixed(2),
    String(item.version),
    item.variant,
    String(item.impressions),
    item.score.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightCheckpointViews(items: InsightCheckpoint[]): InsightCheckpointView[] {
  const views: InsightCheckpointView[] = [];
  for (const item of items) {
    views.push(toInsightCheckpointView(item));
  }
  return views;
}

export function sumInsightCheckpointView(view: InsightCheckpointView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRate + parsedVersion + parsedImpressions;
}
