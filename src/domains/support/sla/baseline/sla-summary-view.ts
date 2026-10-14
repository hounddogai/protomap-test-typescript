import * as text from "../../../../kit/text.js";
import { SlaSummary } from "./sla-summary.js";

/** How screens and exports show a sla summary. */
export class SlaSummaryView {
  code: string;
  label: string;
  notes: string;
  pinned: string;
  endsAt: string;
  score: string;
  utmSourceText: string;
  category: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notes: string,
    pinned: string,
    endsAt: string,
    score: string,
    utmSourceText: string,
    category: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.score = score;
    this.utmSourceText = utmSourceText;
    this.category = category;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toSlaSummaryView(item: SlaSummary): SlaSummaryView {
  return new SlaSummaryView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    text.truncate(item.notes, 40),
    `${item.pinned}`,
    String(item.endsAt),
    item.score.toFixed(2),
    text.truncate(item.utmSource, 80),
    item.category,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaSummaryViews(items: SlaSummary[]): SlaSummaryView[] {
  const views: SlaSummaryView[] = [];
  for (const item of items) {
    views.push(toSlaSummaryView(item));
  }
  return views;
}

export function sumSlaSummaryView(view: SlaSummaryView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedEndsAt + parsedScore;
}
