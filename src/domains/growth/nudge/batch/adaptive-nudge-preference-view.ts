import * as text from "../../../../kit/text.js";
import { AdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

/** How screens and exports show a adaptive nudge preference. */
export class AdaptiveNudgePreferenceView {
  codeText: string;
  labelText: string;
  campaignRef: string;
  source: string;
  currency: string;
  clicks: string;
  startsAt: string;
  updatedAt: string;
  visibleText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    campaignRef: string,
    source: string,
    currency: string,
    clicks: string,
    startsAt: string,
    updatedAt: string,
    visibleText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.campaignRef = campaignRef;
    this.source = source;
    this.currency = currency;
    this.clicks = clicks;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.visibleText = visibleText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveNudgePreferenceView(item: AdaptiveNudgePreference): AdaptiveNudgePreferenceView {
  return new AdaptiveNudgePreferenceView(
    text.truncate(item.code, 64),
    item.label,
    item.campaignRef,
    item.source,
    item.currency,
    String(item.clicks),
    String(item.startsAt),
    String(item.updatedAt),
    `${item.visible}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveNudgePreferenceViews(items: AdaptiveNudgePreference[]): AdaptiveNudgePreferenceView[] {
  const views: AdaptiveNudgePreferenceView[] = [];
  for (const item of items) {
    views.push(toAdaptiveNudgePreferenceView(item));
  }
  return views;
}

export function sumAdaptiveNudgePreferenceView(view: AdaptiveNudgePreferenceView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedClicks + parsedStartsAt + parsedUpdatedAt;
}
