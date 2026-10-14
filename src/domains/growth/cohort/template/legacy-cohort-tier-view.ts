import * as text from "../../../../kit/text.js";
import { LegacyCohortTier } from "./legacy-cohort-tier.js";

/** How screens and exports show a legacy cohort tier. */
export class LegacyCohortTierView {
  code: string;
  labelText: string;
  cohort: string;
  windowDays: string;
  priority: string;
  reviewer: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohort: string,
    windowDays: string,
    priority: string,
    reviewer: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.priority = priority;
    this.reviewer = reviewer;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCohortTierView(item: LegacyCohortTier): LegacyCohortTierView {
  return new LegacyCohortTierView(
    item.code,
    item.label,
    text.truncate(item.cohort, 40),
    String(item.windowDays),
    String(item.priority),
    item.reviewer,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCohortTierViews(items: LegacyCohortTier[]): LegacyCohortTierView[] {
  const views: LegacyCohortTierView[] = [];
  for (const item of items) {
    views.push(toLegacyCohortTierView(item));
  }
  return views;
}

export function sumLegacyCohortTierView(view: LegacyCohortTierView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedWindowDays + parsedPriority;
}
