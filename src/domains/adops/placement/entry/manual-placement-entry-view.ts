import * as text from "../../../../kit/text.js";
import { ManualPlacementEntry } from "./manual-placement-entry.js";

/** How screens and exports show a manual placement entry. */
export class ManualPlacementEntryView {
  code: string;
  titleText: string;
  priority: string;
  graceDaysText: string;
  sourceText: string;
  versionText: string;
  openRate: string;
  durationMinutes: string;
  segment: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    priority: string,
    graceDaysText: string,
    sourceText: string,
    versionText: string,
    openRate: string,
    durationMinutes: string,
    segment: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.priority = priority;
    this.graceDaysText = graceDaysText;
    this.sourceText = sourceText;
    this.versionText = versionText;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.segment = segment;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toManualPlacementEntryView(item: ManualPlacementEntry): ManualPlacementEntryView {
  return new ManualPlacementEntryView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 40),
    String(item.priority),
    String(item.graceDays),
    item.source,
    String(item.version),
    item.openRate.toFixed(2),
    String(item.durationMinutes),
    item.segment,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPlacementEntryViews(items: ManualPlacementEntry[]): ManualPlacementEntryView[] {
  const views: ManualPlacementEntryView[] = [];
  for (const item of items) {
    views.push(toManualPlacementEntryView(item));
  }
  return views;
}

export function sumManualPlacementEntryView(view: ManualPlacementEntryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedPriority + parsedGraceDays + parsedVersion;
}
