import * as text from "../../../../kit/text.js";
import { BatchedFlightSnapshot } from "./batched-flight-snapshot.js";

/** How screens and exports show a batched flight snapshot. */
export class BatchedFlightSnapshotView {
  code: string;
  name: string;
  checksumText: string;
  title: string;
  category: string;
  minimumText: string;
  reviewerText: string;
  retriesText: string;
  impressions: string;
  revision: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksumText: string,
    title: string,
    category: string,
    minimumText: string,
    reviewerText: string,
    retriesText: string,
    impressions: string,
    revision: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksumText = checksumText;
    this.title = title;
    this.category = category;
    this.minimumText = minimumText;
    this.reviewerText = reviewerText;
    this.retriesText = retriesText;
    this.impressions = impressions;
    this.revision = revision;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFlightSnapshotView(item: BatchedFlightSnapshot): BatchedFlightSnapshotView {
  return new BatchedFlightSnapshotView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.checksum, 40),
    item.title,
    item.category,
    item.minimum.toFixed(2),
    item.reviewer,
    String(item.retries),
    String(item.impressions),
    String(item.revision),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFlightSnapshotViews(items: BatchedFlightSnapshot[]): BatchedFlightSnapshotView[] {
  const views: BatchedFlightSnapshotView[] = [];
  for (const item of items) {
    views.push(toBatchedFlightSnapshotView(item));
  }
  return views;
}

export function sumBatchedFlightSnapshotView(view: BatchedFlightSnapshotView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedRetries + parsedImpressions;
}
