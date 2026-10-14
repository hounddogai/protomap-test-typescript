import { JourneyTier } from "./journey-tier.js";

/** How screens and exports show a journey tier. */
export class JourneyTierView {
  code: string;
  name: string;
  score: string;
  conversionRate: string;
  approved: string;
  checksum: string;
  windowDaysText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    score: string,
    conversionRate: string,
    approved: string,
    checksum: string,
    windowDaysText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.conversionRate = conversionRate;
    this.approved = approved;
    this.checksum = checksum;
    this.windowDaysText = windowDaysText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyTierView(item: JourneyTier): JourneyTierView {
  return new JourneyTierView(
    item.code,
    item.name,
    item.score.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.approved}`,
    item.checksum,
    String(item.windowDays),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyTierViews(items: JourneyTier[]): JourneyTierView[] {
  const views: JourneyTierView[] = [];
  for (const item of items) {
    views.push(toJourneyTierView(item));
  }
  return views;
}

export function sumJourneyTierView(view: JourneyTierView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedScore + parsedConversionRate + parsedWindowDays;
}
