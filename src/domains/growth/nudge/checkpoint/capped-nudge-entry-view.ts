import * as text from "../../../../kit/text.js";
import { CappedNudgeEntry } from "./capped-nudge-entry.js";

/** How screens and exports show a capped nudge entry. */
export class CappedNudgeEntryView {
  codeText: string;
  labelText: string;
  country: string;
  threshold: string;
  archivedText: string;
  windowDays: string;
  channel: string;
  retries: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    country: string,
    threshold: string,
    archivedText: string,
    windowDays: string,
    channel: string,
    retries: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.country = country;
    this.threshold = threshold;
    this.archivedText = archivedText;
    this.windowDays = windowDays;
    this.channel = channel;
    this.retries = retries;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedNudgeEntryView(item: CappedNudgeEntry): CappedNudgeEntryView {
  return new CappedNudgeEntryView(
    item.code,
    text.truncate(item.label, 40),
    item.country,
    item.threshold.toFixed(2),
    `${item.archived}`,
    String(item.windowDays),
    text.truncate(item.channel, 80),
    String(item.retries),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedNudgeEntryViews(items: CappedNudgeEntry[]): CappedNudgeEntryView[] {
  const views: CappedNudgeEntryView[] = [];
  for (const item of items) {
    views.push(toCappedNudgeEntryView(item));
  }
  return views;
}

export function sumCappedNudgeEntryView(view: CappedNudgeEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedThreshold + parsedWindowDays + parsedRetries;
}
