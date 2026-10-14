import { SeasonalExitRulePreference } from "./seasonal-exit-rule-preference.js";

/** How screens and exports show a seasonal exit rule preference. */
export class SeasonalExitRulePreferenceView {
  code: string;
  title: string;
  durationMinutesText: string;
  pinnedText: string;
  maximum: string;
  locale: string;
  budgetText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutesText: string,
    pinnedText: string,
    maximum: string,
    locale: string,
    budgetText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.pinnedText = pinnedText;
    this.maximum = maximum;
    this.locale = locale;
    this.budgetText = budgetText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalExitRulePreferenceView(item: SeasonalExitRulePreference): SeasonalExitRulePreferenceView {
  return new SeasonalExitRulePreferenceView(
    item.code,
    item.title,
    String(item.durationMinutes),
    `${item.pinned}`,
    item.maximum.toFixed(2),
    item.locale,
    item.budget.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalExitRulePreferenceViews(items: SeasonalExitRulePreference[]): SeasonalExitRulePreferenceView[] {
  const views: SeasonalExitRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toSeasonalExitRulePreferenceView(item));
  }
  return views;
}

export function sumSeasonalExitRulePreferenceView(view: SeasonalExitRulePreferenceView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDurationMinutes + parsedMaximum + parsedBudget;
}
