import * as text from "../../../../kit/text.js";
import { RollingLevelCycle } from "./rolling-level-cycle.js";

/** How screens and exports show a rolling level cycle. */
export class RollingLevelCycleView {
  code: string;
  title: string;
  locale: string;
  endsAtText: string;
  windowDaysText: string;
  impressionsText: string;
  approvedText: string;
  revision: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    endsAtText: string,
    windowDaysText: string,
    impressionsText: string,
    approvedText: string,
    revision: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.endsAtText = endsAtText;
    this.windowDaysText = windowDaysText;
    this.impressionsText = impressionsText;
    this.approvedText = approvedText;
    this.revision = revision;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLevelCycleView(item: RollingLevelCycle): RollingLevelCycleView {
  return new RollingLevelCycleView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    text.truncate(item.locale, 64),
    String(item.endsAt),
    String(item.windowDays),
    String(item.impressions),
    `${item.approved}`,
    String(item.revision),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLevelCycleViews(items: RollingLevelCycle[]): RollingLevelCycleView[] {
  const views: RollingLevelCycleView[] = [];
  for (const item of items) {
    views.push(toRollingLevelCycleView(item));
  }
  return views;
}

export function sumRollingLevelCycleView(view: RollingLevelCycleView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedEndsAt + parsedWindowDays + parsedImpressions;
}
