import * as text from "../../../../kit/text.js";
import { LegacyChallengePreference } from "./legacy-challenge-preference.js";

/** How screens and exports show a legacy challenge preference. */
export class LegacyChallengePreferenceView {
  code: string;
  titleText: string;
  clicks: string;
  ownerId: string;
  segment: string;
  budget: string;
  cohort: string;
  channel: string;
  campaignRefText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    clicks: string,
    ownerId: string,
    segment: string,
    budget: string,
    cohort: string,
    channel: string,
    campaignRefText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.clicks = clicks;
    this.ownerId = ownerId;
    this.segment = segment;
    this.budget = budget;
    this.cohort = cohort;
    this.channel = channel;
    this.campaignRefText = campaignRefText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyChallengePreferenceView(item: LegacyChallengePreference): LegacyChallengePreferenceView {
  return new LegacyChallengePreferenceView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    String(item.clicks),
    item.ownerId,
    item.segment,
    item.budget.toFixed(2),
    item.cohort,
    item.channel,
    item.campaignRef,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyChallengePreferenceViews(items: LegacyChallengePreference[]): LegacyChallengePreferenceView[] {
  const views: LegacyChallengePreferenceView[] = [];
  for (const item of items) {
    views.push(toLegacyChallengePreferenceView(item));
  }
  return views;
}

export function sumLegacyChallengePreferenceView(view: LegacyChallengePreferenceView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedClicks + parsedBudget;
}
