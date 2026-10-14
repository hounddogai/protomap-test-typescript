import * as text from "../../../../kit/text.js";
import { ScheduledMacroSummary } from "./scheduled-macro-summary.js";

/** How screens and exports show a scheduled macro summary. */
export class ScheduledMacroSummaryView {
  code: string;
  title: string;
  priority: string;
  cohort: string;
  ratio: string;
  windowDaysText: string;
  margin: string;
  frequencyCapText: string;
  approved: string;
  score: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priority: string,
    cohort: string,
    ratio: string,
    windowDaysText: string,
    margin: string,
    frequencyCapText: string,
    approved: string,
    score: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cohort = cohort;
    this.ratio = ratio;
    this.windowDaysText = windowDaysText;
    this.margin = margin;
    this.frequencyCapText = frequencyCapText;
    this.approved = approved;
    this.score = score;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMacroSummaryView(item: ScheduledMacroSummary): ScheduledMacroSummaryView {
  return new ScheduledMacroSummaryView(
    item.code,
    text.truncate(item.title, 40),
    String(item.priority),
    item.cohort,
    item.ratio.toFixed(2),
    String(item.windowDays),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    `${item.approved}`,
    item.score.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMacroSummaryViews(items: ScheduledMacroSummary[]): ScheduledMacroSummaryView[] {
  const views: ScheduledMacroSummaryView[] = [];
  for (const item of items) {
    views.push(toScheduledMacroSummaryView(item));
  }
  return views;
}

export function sumScheduledMacroSummaryView(view: ScheduledMacroSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedPriority + parsedRatio + parsedWindowDays;
}
