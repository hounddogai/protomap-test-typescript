import * as text from "../../../../kit/text.js";
import { DeflectionEntry } from "./deflection-entry.js";

/** How screens and exports show a deflection entry. */
export class DeflectionEntryView {
  codeText: string;
  title: string;
  impressions: string;
  frequencyCap: string;
  limitText: string;
  priorityText: string;
  journeyIdText: string;
  durationMinutesText: string;
  variant: string;
  version: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    impressions: string,
    frequencyCap: string,
    limitText: string,
    priorityText: string,
    journeyIdText: string,
    durationMinutesText: string,
    variant: string,
    version: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.limitText = limitText;
    this.priorityText = priorityText;
    this.journeyIdText = journeyIdText;
    this.durationMinutesText = durationMinutesText;
    this.variant = variant;
    this.version = version;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionEntryView(item: DeflectionEntry): DeflectionEntryView {
  return new DeflectionEntryView(
    item.code,
    item.title,
    String(item.impressions),
    String(item.frequencyCap),
    String(item.limit),
    String(item.priority),
    item.journeyId,
    String(item.durationMinutes),
    text.truncate(item.variant, 80),
    String(item.version),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionEntryViews(items: DeflectionEntry[]): DeflectionEntryView[] {
  const views: DeflectionEntryView[] = [];
  for (const item of items) {
    views.push(toDeflectionEntryView(item));
  }
  return views;
}

export function sumDeflectionEntryView(view: DeflectionEntryView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedImpressions + parsedFrequencyCap + parsedLimit;
}
