import * as text from "../../../../kit/text.js";
import { RegionalConversionScore } from "./regional-conversion-score.js";

/** How screens and exports show a regional conversion score. */
export class RegionalConversionScoreView {
  code: string;
  label: string;
  summary: string;
  windowDays: string;
  limit: string;
  updatedAtText: string;
  notesText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    windowDays: string,
    limit: string,
    updatedAtText: string,
    notesText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.windowDays = windowDays;
    this.limit = limit;
    this.updatedAtText = updatedAtText;
    this.notesText = notesText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalConversionScoreView(item: RegionalConversionScore): RegionalConversionScoreView {
  return new RegionalConversionScoreView(
    item.code,
    item.label,
    text.truncate(item.summary, 40),
    String(item.windowDays),
    String(item.limit),
    String(item.updatedAt),
    text.truncate(item.notes, 40),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalConversionScoreViews(items: RegionalConversionScore[]): RegionalConversionScoreView[] {
  const views: RegionalConversionScoreView[] = [];
  for (const item of items) {
    views.push(toRegionalConversionScoreView(item));
  }
  return views;
}

export function sumRegionalConversionScoreView(view: RegionalConversionScoreView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedWindowDays + parsedLimit + parsedUpdatedAt;
}
