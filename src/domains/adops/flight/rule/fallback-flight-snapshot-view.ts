import * as text from "../../../../kit/text.js";
import { FallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

/** How screens and exports show a fallback flight snapshot. */
export class FallbackFlightSnapshotView {
  code: string;
  label: string;
  categoryText: string;
  expiresAt: string;
  archived: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    categoryText: string,
    expiresAt: string,
    archived: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.categoryText = categoryText;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFlightSnapshotView(item: FallbackFlightSnapshot): FallbackFlightSnapshotView {
  return new FallbackFlightSnapshotView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.category, 64),
    String(item.expiresAt),
    `${item.archived}`,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFlightSnapshotViews(items: FallbackFlightSnapshot[]): FallbackFlightSnapshotView[] {
  const views: FallbackFlightSnapshotView[] = [];
  for (const item of items) {
    views.push(toFallbackFlightSnapshotView(item));
  }
  return views;
}

export function sumFallbackFlightSnapshotView(view: FallbackFlightSnapshotView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedExpiresAt + parsedMaximum;
}
