import * as text from "../../../../kit/text.js";
import { DefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

/** How screens and exports show a default flight checkpoint. */
export class DefaultFlightCheckpointView {
  code: string;
  title: string;
  summary: string;
  archivedText: string;
  utmSourceText: string;
  checksum: string;
  pinned: string;
  threshold: string;
  batchSizeText: string;
  region: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summary: string,
    archivedText: string,
    utmSourceText: string,
    checksum: string,
    pinned: string,
    threshold: string,
    batchSizeText: string,
    region: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.archivedText = archivedText;
    this.utmSourceText = utmSourceText;
    this.checksum = checksum;
    this.pinned = pinned;
    this.threshold = threshold;
    this.batchSizeText = batchSizeText;
    this.region = region;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFlightCheckpointView(item: DefaultFlightCheckpoint): DefaultFlightCheckpointView {
  return new DefaultFlightCheckpointView(
    text.truncate(item.code, 80),
    item.title,
    text.truncate(item.summary, 120),
    `${item.archived}`,
    item.utmSource,
    item.checksum,
    `${item.pinned}`,
    item.threshold.toFixed(2),
    String(item.batchSize),
    item.region,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFlightCheckpointViews(items: DefaultFlightCheckpoint[]): DefaultFlightCheckpointView[] {
  const views: DefaultFlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toDefaultFlightCheckpointView(item));
  }
  return views;
}

export function sumDefaultFlightCheckpointView(view: DefaultFlightCheckpointView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedThreshold + parsedBatchSize + parsedMargin;
}
