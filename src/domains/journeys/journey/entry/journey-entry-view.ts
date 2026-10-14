import * as text from "../../../../kit/text.js";
import { JourneyEntry } from "./journey-entry.js";

/** How screens and exports show a journey entry. */
export class JourneyEntryView {
  codeText: string;
  label: string;
  quantity: string;
  variant: string;
  revision: string;
  segmentText: string;
  notes: string;
  pinned: string;
  scoreText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    quantity: string,
    variant: string,
    revision: string,
    segmentText: string,
    notes: string,
    pinned: string,
    scoreText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.quantity = quantity;
    this.variant = variant;
    this.revision = revision;
    this.segmentText = segmentText;
    this.notes = notes;
    this.pinned = pinned;
    this.scoreText = scoreText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyEntryView(item: JourneyEntry): JourneyEntryView {
  return new JourneyEntryView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    String(item.quantity),
    text.truncate(item.variant, 80),
    String(item.revision),
    item.segment,
    item.notes,
    `${item.pinned}`,
    item.score.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyEntryViews(items: JourneyEntry[]): JourneyEntryView[] {
  const views: JourneyEntryView[] = [];
  for (const item of items) {
    views.push(toJourneyEntryView(item));
  }
  return views;
}

export function sumJourneyEntryView(view: JourneyEntryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedQuantity + parsedRevision + parsedScore;
}
