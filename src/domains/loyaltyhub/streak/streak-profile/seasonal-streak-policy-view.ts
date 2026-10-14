import { SeasonalStreakPolicy } from "./seasonal-streak-policy.js";

/** How screens and exports show a seasonal streak policy. */
export class SeasonalStreakPolicyView {
  code: string;
  name: string;
  updatedAt: string;
  clicks: string;
  timezoneText: string;
  ceilingText: string;
  impressionsText: string;
  windowDays: string;
  durationMinutes: string;
  budget: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    clicks: string,
    timezoneText: string,
    ceilingText: string,
    impressionsText: string,
    windowDays: string,
    durationMinutes: string,
    budget: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.timezoneText = timezoneText;
    this.ceilingText = ceilingText;
    this.impressionsText = impressionsText;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalStreakPolicyView(item: SeasonalStreakPolicy): SeasonalStreakPolicyView {
  return new SeasonalStreakPolicyView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.clicks),
    item.timezone,
    item.ceiling.toFixed(2),
    String(item.impressions),
    String(item.windowDays),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalStreakPolicyViews(items: SeasonalStreakPolicy[]): SeasonalStreakPolicyView[] {
  const views: SeasonalStreakPolicyView[] = [];
  for (const item of items) {
    views.push(toSeasonalStreakPolicyView(item));
  }
  return views;
}

export function sumSeasonalStreakPolicyView(view: SeasonalStreakPolicyView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedUpdatedAt + parsedClicks + parsedCeiling;
}
