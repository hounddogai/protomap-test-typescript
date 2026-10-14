import { SeasonalCsatPolicy } from "./seasonal-csat-policy.js";

/** How screens and exports show a seasonal csat policy. */
export class SeasonalCsatPolicyView {
  code: string;
  name: string;
  retries: string;
  channel: string;
  attempts: string;
  titleText: string;
  thresholdText: string;
  reviewerText: string;
  endsAt: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    channel: string,
    attempts: string,
    titleText: string,
    thresholdText: string,
    reviewerText: string,
    endsAt: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.channel = channel;
    this.attempts = attempts;
    this.titleText = titleText;
    this.thresholdText = thresholdText;
    this.reviewerText = reviewerText;
    this.endsAt = endsAt;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCsatPolicyView(item: SeasonalCsatPolicy): SeasonalCsatPolicyView {
  return new SeasonalCsatPolicyView(
    item.code,
    item.name,
    String(item.retries),
    item.channel,
    String(item.attempts),
    item.title,
    item.threshold.toFixed(2),
    item.reviewer,
    String(item.endsAt),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCsatPolicyViews(items: SeasonalCsatPolicy[]): SeasonalCsatPolicyView[] {
  const views: SeasonalCsatPolicyView[] = [];
  for (const item of items) {
    views.push(toSeasonalCsatPolicyView(item));
  }
  return views;
}

export function sumSeasonalCsatPolicyView(view: SeasonalCsatPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedRetries + parsedAttempts + parsedThreshold;
}
