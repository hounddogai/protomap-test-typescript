import * as text from "../../../../kit/text.js";
import { MacroEntry } from "./macro-entry.js";

/** How screens and exports show a macro entry. */
export class MacroEntryView {
  code: string;
  nameText: string;
  threshold: string;
  sendAt: string;
  segment: string;
  utmSource: string;
  region: string;
  rateText: string;
  budget: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    threshold: string,
    sendAt: string,
    segment: string,
    utmSource: string,
    region: string,
    rateText: string,
    budget: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.segment = segment;
    this.utmSource = utmSource;
    this.region = region;
    this.rateText = rateText;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toMacroEntryView(item: MacroEntry): MacroEntryView {
  return new MacroEntryView(
    item.code,
    text.truncate(item.name, 40),
    item.threshold.toFixed(2),
    String(item.sendAt),
    text.truncate(item.segment, 120),
    text.truncate(item.utmSource, 80),
    item.region,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroEntryViews(items: MacroEntry[]): MacroEntryView[] {
  const views: MacroEntryView[] = [];
  for (const item of items) {
    views.push(toMacroEntryView(item));
  }
  return views;
}

export function sumMacroEntryView(view: MacroEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedThreshold + parsedSendAt + parsedRate;
}
