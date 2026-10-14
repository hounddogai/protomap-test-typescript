import * as text from "../../../../kit/text.js";
import { RollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

/** How screens and exports show a rolling touchpoint template. */
export class RollingTouchpointTemplateView {
  code: string;
  title: string;
  summaryText: string;
  cohort: string;
  reviewer: string;
  durationMinutes: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summaryText: string,
    cohort: string,
    reviewer: string,
    durationMinutes: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summaryText = summaryText;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toRollingTouchpointTemplateView(item: RollingTouchpointTemplate): RollingTouchpointTemplateView {
  return new RollingTouchpointTemplateView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 120),
    item.summary,
    item.cohort,
    text.truncate(item.reviewer, 40),
    String(item.durationMinutes),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingTouchpointTemplateViews(items: RollingTouchpointTemplate[]): RollingTouchpointTemplateView[] {
  const views: RollingTouchpointTemplateView[] = [];
  for (const item of items) {
    views.push(toRollingTouchpointTemplateView(item));
  }
  return views;
}

export function sumRollingTouchpointTemplateView(view: RollingTouchpointTemplateView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
