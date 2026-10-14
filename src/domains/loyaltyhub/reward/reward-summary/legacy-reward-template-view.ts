import * as text from "../../../../kit/text.js";
import { LegacyRewardTemplate } from "./legacy-reward-template.js";

/** How screens and exports show a legacy reward template. */
export class LegacyRewardTemplateView {
  code: string;
  title: string;
  pinned: string;
  timezoneText: string;
  archived: string;
  minimumText: string;
  journeyId: string;
  thresholdText: string;
  locale: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    pinned: string,
    timezoneText: string,
    archived: string,
    minimumText: string,
    journeyId: string,
    thresholdText: string,
    locale: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.timezoneText = timezoneText;
    this.archived = archived;
    this.minimumText = minimumText;
    this.journeyId = journeyId;
    this.thresholdText = thresholdText;
    this.locale = locale;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardTemplateView(item: LegacyRewardTemplate): LegacyRewardTemplateView {
  return new LegacyRewardTemplateView(
    item.code,
    text.truncate(item.title, 40),
    `${item.pinned}`,
    item.timezone,
    `${item.archived}`,
    item.minimum.toFixed(2),
    item.journeyId,
    item.threshold.toFixed(2),
    item.locale,
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardTemplateViews(items: LegacyRewardTemplate[]): LegacyRewardTemplateView[] {
  const views: LegacyRewardTemplateView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardTemplateView(item));
  }
  return views;
}

export function sumLegacyRewardTemplateView(view: LegacyRewardTemplateView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedMinimum + parsedThreshold;
}
