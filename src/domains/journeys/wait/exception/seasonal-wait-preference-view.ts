import * as text from "../../../../kit/text.js";
import { SeasonalWaitPreference } from "./seasonal-wait-preference.js";

/** How screens and exports show a seasonal wait preference. */
export class SeasonalWaitPreferenceView {
  code: string;
  label: string;
  variant: string;
  rateText: string;
  bid: string;
  sequence: string;
  reviewer: string;
  active: string;
  updatedAtText: string;
  windowDays: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    variant: string,
    rateText: string,
    bid: string,
    sequence: string,
    reviewer: string,
    active: string,
    updatedAtText: string,
    windowDays: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.rateText = rateText;
    this.bid = bid;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.active = active;
    this.updatedAtText = updatedAtText;
    this.windowDays = windowDays;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalWaitPreferenceView(item: SeasonalWaitPreference): SeasonalWaitPreferenceView {
  return new SeasonalWaitPreferenceView(
    text.truncate(item.code, 40),
    item.label,
    item.variant,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    String(item.sequence),
    item.reviewer,
    `${item.active}`,
    String(item.updatedAt),
    String(item.windowDays),
    text.truncate(item.checksum, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalWaitPreferenceViews(items: SeasonalWaitPreference[]): SeasonalWaitPreferenceView[] {
  const views: SeasonalWaitPreferenceView[] = [];
  for (const item of items) {
    views.push(toSeasonalWaitPreferenceView(item));
  }
  return views;
}

export function sumSeasonalWaitPreferenceView(view: SeasonalWaitPreferenceView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRate + parsedBid + parsedSequence;
}
