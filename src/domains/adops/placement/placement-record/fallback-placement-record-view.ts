import * as text from "../../../../kit/text.js";
import { FallbackPlacementRecord } from "./fallback-placement-record.js";

/** How screens and exports show a fallback placement record. */
export class FallbackPlacementRecordView {
  code: string;
  titleText: string;
  notes: string;
  minimum: string;
  impressions: string;
  archived: string;
  contactEmail: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notes: string,
    minimum: string,
    impressions: string,
    archived: string,
    contactEmail: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notes = notes;
    this.minimum = minimum;
    this.impressions = impressions;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPlacementRecordView(item: FallbackPlacementRecord): FallbackPlacementRecordView {
  return new FallbackPlacementRecordView(
    item.code,
    item.title,
    item.notes,
    item.minimum.toFixed(2),
    String(item.impressions),
    `${item.archived}`,
    item.contactEmail,
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPlacementRecordViews(items: FallbackPlacementRecord[]): FallbackPlacementRecordView[] {
  const views: FallbackPlacementRecordView[] = [];
  for (const item of items) {
    views.push(toFallbackPlacementRecordView(item));
  }
  return views;
}

export function sumFallbackPlacementRecordView(view: FallbackPlacementRecordView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedImpressions;
}
