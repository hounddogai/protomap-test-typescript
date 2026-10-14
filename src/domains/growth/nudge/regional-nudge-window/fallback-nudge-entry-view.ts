import * as text from "../../../../kit/text.js";
import { FallbackNudgeEntry } from "./fallback-nudge-entry.js";

/** How screens and exports show a fallback nudge entry. */
export class FallbackNudgeEntryView {
  codeText: string;
  title: string;
  durationMinutes: string;
  channel: string;
  version: string;
  quantity: string;
  name: string;
  utmSourceText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutes: string,
    channel: string,
    version: string,
    quantity: string,
    name: string,
    utmSourceText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.version = version;
    this.quantity = quantity;
    this.name = name;
    this.utmSourceText = utmSourceText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackNudgeEntryView(item: FallbackNudgeEntry): FallbackNudgeEntryView {
  return new FallbackNudgeEntryView(
    item.code,
    text.truncate(item.title, 80),
    String(item.durationMinutes),
    item.channel,
    String(item.version),
    String(item.quantity),
    text.truncate(item.name, 80),
    text.truncate(item.utmSource, 120),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackNudgeEntryViews(items: FallbackNudgeEntry[]): FallbackNudgeEntryView[] {
  const views: FallbackNudgeEntryView[] = [];
  for (const item of items) {
    views.push(toFallbackNudgeEntryView(item));
  }
  return views;
}

export function sumFallbackNudgeEntryView(view: FallbackNudgeEntryView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDurationMinutes + parsedVersion + parsedQuantity;
}
