import * as text from "../../../../kit/text.js";
import { RegionalModelCheckpoint } from "./regional-model-checkpoint.js";

/** How screens and exports show a regional model checkpoint. */
export class RegionalModelCheckpointView {
  codeText: string;
  titleText: string;
  margin: string;
  threshold: string;
  openRate: string;
  durationMinutes: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    margin: string,
    threshold: string,
    openRate: string,
    durationMinutes: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.margin = margin;
    this.threshold = threshold;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalModelCheckpointView(item: RegionalModelCheckpoint): RegionalModelCheckpointView {
  return new RegionalModelCheckpointView(
    text.truncate(item.code, 80),
    item.title,
    item.margin.toFixed(2),
    item.threshold.toFixed(2),
    item.openRate.toFixed(2),
    String(item.durationMinutes),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalModelCheckpointViews(items: RegionalModelCheckpoint[]): RegionalModelCheckpointView[] {
  const views: RegionalModelCheckpointView[] = [];
  for (const item of items) {
    views.push(toRegionalModelCheckpointView(item));
  }
  return views;
}

export function sumRegionalModelCheckpointView(view: RegionalModelCheckpointView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedMargin + parsedThreshold + parsedOpenRate;
}
