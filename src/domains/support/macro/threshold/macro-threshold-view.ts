import * as text from "../../../../kit/text.js";
import { MacroThreshold } from "./macro-threshold.js";

/** How screens and exports show a macro threshold. */
export class MacroThresholdView {
  code: string;
  titleText: string;
  limit: string;
  startsAt: string;
  locale: string;
  revisionText: string;
  rate: string;
  notesText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    limit: string,
    startsAt: string,
    locale: string,
    revisionText: string,
    rate: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.limit = limit;
    this.startsAt = startsAt;
    this.locale = locale;
    this.revisionText = revisionText;
    this.rate = rate;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toMacroThresholdView(item: MacroThreshold): MacroThresholdView {
  return new MacroThresholdView(
    item.code,
    text.truncate(item.title, 80),
    String(item.limit),
    String(item.startsAt),
    item.locale,
    String(item.revision),
    item.rate.toFixed(2),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroThresholdViews(items: MacroThreshold[]): MacroThresholdView[] {
  const views: MacroThresholdView[] = [];
  for (const item of items) {
    views.push(toMacroThresholdView(item));
  }
  return views;
}

export function sumMacroThresholdView(view: MacroThresholdView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedLimit + parsedStartsAt + parsedRevision;
}
