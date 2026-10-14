import * as text from "../../../../kit/text.js";
import { PendingPostDigest } from "./pending-post-digest.js";

/** How screens and exports show a pending post digest. */
export class PendingPostDigestView {
  code: string;
  label: string;
  threshold: string;
  source: string;
  segment: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    source: string,
    segment: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.source = source;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPostDigestView(item: PendingPostDigest): PendingPostDigestView {
  return new PendingPostDigestView(
    text.truncate(item.code, 80),
    item.label,
    item.threshold.toFixed(2),
    text.truncate(item.source, 120),
    item.segment,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPostDigestViews(items: PendingPostDigest[]): PendingPostDigestView[] {
  const views: PendingPostDigestView[] = [];
  for (const item of items) {
    views.push(toPendingPostDigestView(item));
  }
  return views;
}

export function sumPendingPostDigestView(view: PendingPostDigestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedThreshold + parsedDurationMinutes;
}
