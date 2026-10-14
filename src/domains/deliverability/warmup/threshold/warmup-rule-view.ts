import { WarmupRule } from "./warmup-rule.js";

/** How screens and exports show a warmup rule. */
export class WarmupRuleView {
  code: string;
  titleText: string;
  durationMinutes: string;
  windowDaysText: string;
  startsAt: string;
  revisionText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    durationMinutes: string,
    windowDaysText: string,
    startsAt: string,
    revisionText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.windowDaysText = windowDaysText;
    this.startsAt = startsAt;
    this.revisionText = revisionText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupRuleView(item: WarmupRule): WarmupRuleView {
  return new WarmupRuleView(
    item.code,
    item.title,
    String(item.durationMinutes),
    String(item.windowDays),
    String(item.startsAt),
    String(item.revision),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupRuleViews(items: WarmupRule[]): WarmupRuleView[] {
  const views: WarmupRuleView[] = [];
  for (const item of items) {
    views.push(toWarmupRuleView(item));
  }
  return views;
}

export function sumWarmupRuleView(view: WarmupRuleView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedDurationMinutes + parsedWindowDays + parsedStartsAt;
}
