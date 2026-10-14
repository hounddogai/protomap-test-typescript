import * as text from "../../../../kit/text.js";
import { JourneyPreference } from "./journey-preference.js";

/** How screens and exports show a journey preference. */
export class JourneyPreferenceView {
  code: string;
  titleText: string;
  clicks: string;
  createdAt: string;
  amountText: string;
  attempts: string;
  region: string;
  variant: string;
  revision: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    clicks: string,
    createdAt: string,
    amountText: string,
    attempts: string,
    region: string,
    variant: string,
    revision: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.clicks = clicks;
    this.createdAt = createdAt;
    this.amountText = amountText;
    this.attempts = attempts;
    this.region = region;
    this.variant = variant;
    this.revision = revision;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyPreferenceView(item: JourneyPreference): JourneyPreferenceView {
  return new JourneyPreferenceView(
    item.code,
    item.title,
    String(item.clicks),
    String(item.createdAt),
    item.amount.toFixed(2),
    String(item.attempts),
    item.region,
    text.truncate(item.variant, 64),
    String(item.revision),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyPreferenceViews(items: JourneyPreference[]): JourneyPreferenceView[] {
  const views: JourneyPreferenceView[] = [];
  for (const item of items) {
    views.push(toJourneyPreferenceView(item));
  }
  return views;
}

export function sumJourneyPreferenceView(view: JourneyPreferenceView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedClicks + parsedCreatedAt + parsedAmount;
}
