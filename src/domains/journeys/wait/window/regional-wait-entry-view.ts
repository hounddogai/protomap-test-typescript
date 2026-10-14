import * as text from "../../../../kit/text.js";
import { RegionalWaitEntry } from "./regional-wait-entry.js";

/** How screens and exports show a regional wait entry. */
export class RegionalWaitEntryView {
  codeText: string;
  label: string;
  margin: string;
  retriesText: string;
  ceiling: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    margin: string,
    retriesText: string,
    ceiling: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.margin = margin;
    this.retriesText = retriesText;
    this.ceiling = ceiling;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalWaitEntryView(item: RegionalWaitEntry): RegionalWaitEntryView {
  return new RegionalWaitEntryView(
    item.code,
    text.truncate(item.label, 40),
    item.margin.toFixed(2),
    String(item.retries),
    item.ceiling.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalWaitEntryViews(items: RegionalWaitEntry[]): RegionalWaitEntryView[] {
  const views: RegionalWaitEntryView[] = [];
  for (const item of items) {
    views.push(toRegionalWaitEntryView(item));
  }
  return views;
}

export function sumRegionalWaitEntryView(view: RegionalWaitEntryView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedMargin + parsedRetries + parsedCeiling;
}
