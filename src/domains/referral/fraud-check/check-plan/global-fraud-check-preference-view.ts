import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

/** How screens and exports show a global fraud check preference. */
export class GlobalFraudCheckPreferenceView {
  code: string;
  name: string;
  journeyId: string;
  openRateText: string;
  segment: string;
  threshold: string;
  frequencyCap: string;
  utmSource: string;
  reviewerText: string;
  phone: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    openRateText: string,
    segment: string,
    threshold: string,
    frequencyCap: string,
    utmSource: string,
    reviewerText: string,
    phone: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.openRateText = openRateText;
    this.segment = segment;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.reviewerText = reviewerText;
    this.phone = phone;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFraudCheckPreferenceView(item: GlobalFraudCheckPreference): GlobalFraudCheckPreferenceView {
  return new GlobalFraudCheckPreferenceView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.journeyId, 40),
    item.openRate.toFixed(2),
    text.truncate(item.segment, 80),
    item.threshold.toFixed(2),
    String(item.frequencyCap),
    item.utmSource,
    item.reviewer,
    item.phone,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFraudCheckPreferenceViews(items: GlobalFraudCheckPreference[]): GlobalFraudCheckPreferenceView[] {
  const views: GlobalFraudCheckPreferenceView[] = [];
  for (const item of items) {
    views.push(toGlobalFraudCheckPreferenceView(item));
  }
  return views;
}

export function sumGlobalFraudCheckPreferenceView(view: GlobalFraudCheckPreferenceView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedOpenRate + parsedThreshold + parsedFrequencyCap;
}
