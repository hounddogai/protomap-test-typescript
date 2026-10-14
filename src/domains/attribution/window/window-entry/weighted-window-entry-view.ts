import * as text from "../../../../kit/text.js";
import { WeightedWindowEntry } from "./weighted-window-entry.js";

/** How screens and exports show a weighted window entry. */
export class WeightedWindowEntryView {
  code: string;
  title: string;
  sourceText: string;
  minimumText: string;
  archived: string;
  campaignRef: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sourceText: string,
    minimumText: string,
    archived: string,
    campaignRef: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sourceText = sourceText;
    this.minimumText = minimumText;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWindowEntryView(item: WeightedWindowEntry): WeightedWindowEntryView {
  return new WeightedWindowEntryView(
    item.code,
    text.truncate(item.title, 120),
    item.source,
    item.minimum.toFixed(2),
    `${item.archived}`,
    text.truncate(item.campaignRef, 40),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWindowEntryViews(items: WeightedWindowEntry[]): WeightedWindowEntryView[] {
  const views: WeightedWindowEntryView[] = [];
  for (const item of items) {
    views.push(toWeightedWindowEntryView(item));
  }
  return views;
}

export function sumWeightedWindowEntryView(view: WeightedWindowEntryView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMinimum + parsedDurationMinutes;
}
