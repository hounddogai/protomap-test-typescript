import * as text from "../../../../kit/text.js";
import { BatchedBounceManifest } from "./batched-bounce-manifest.js";

/** How screens and exports show a batched bounce manifest. */
export class BatchedBounceManifestView {
  code: string;
  nameText: string;
  impressionsText: string;
  startsAt: string;
  archivedText: string;
  rate: string;
  sendAt: string;
  pinnedText: string;
  reviewerText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    impressionsText: string,
    startsAt: string,
    archivedText: string,
    rate: string,
    sendAt: string,
    pinnedText: string,
    reviewerText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.impressionsText = impressionsText;
    this.startsAt = startsAt;
    this.archivedText = archivedText;
    this.rate = rate;
    this.sendAt = sendAt;
    this.pinnedText = pinnedText;
    this.reviewerText = reviewerText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBounceManifestView(item: BatchedBounceManifest): BatchedBounceManifestView {
  return new BatchedBounceManifestView(
    item.code,
    text.truncate(item.name, 120),
    String(item.impressions),
    String(item.startsAt),
    `${item.archived}`,
    item.rate.toFixed(2),
    String(item.sendAt),
    `${item.pinned}`,
    item.reviewer,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBounceManifestViews(items: BatchedBounceManifest[]): BatchedBounceManifestView[] {
  const views: BatchedBounceManifestView[] = [];
  for (const item of items) {
    views.push(toBatchedBounceManifestView(item));
  }
  return views;
}

export function sumBatchedBounceManifestView(view: BatchedBounceManifestView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedImpressions + parsedStartsAt + parsedRate;
}
