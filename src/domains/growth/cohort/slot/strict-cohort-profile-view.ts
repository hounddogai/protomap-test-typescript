import * as text from "../../../../kit/text.js";
import { StrictCohortProfile } from "./strict-cohort-profile.js";

/** How screens and exports show a strict cohort profile. */
export class StrictCohortProfileView {
  codeText: string;
  name: string;
  timezone: string;
  updatedAt: string;
  channelText: string;
  locale: string;
  variant: string;
  openRate: string;
  attempts: string;
  batchSize: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    timezone: string,
    updatedAt: string,
    channelText: string,
    locale: string,
    variant: string,
    openRate: string,
    attempts: string,
    batchSize: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.channelText = channelText;
    this.locale = locale;
    this.variant = variant;
    this.openRate = openRate;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCohortProfileView(item: StrictCohortProfile): StrictCohortProfileView {
  return new StrictCohortProfileView(
    item.code,
    item.name,
    item.timezone,
    String(item.updatedAt),
    item.channel,
    item.locale,
    text.truncate(item.variant, 40),
    item.openRate.toFixed(2),
    String(item.attempts),
    String(item.batchSize),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCohortProfileViews(items: StrictCohortProfile[]): StrictCohortProfileView[] {
  const views: StrictCohortProfileView[] = [];
  for (const item of items) {
    views.push(toStrictCohortProfileView(item));
  }
  return views;
}

export function sumStrictCohortProfileView(view: StrictCohortProfileView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedUpdatedAt + parsedOpenRate + parsedAttempts;
}
