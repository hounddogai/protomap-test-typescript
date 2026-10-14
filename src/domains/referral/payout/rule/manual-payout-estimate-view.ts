import * as text from "../../../../kit/text.js";
import { ManualPayoutEstimate } from "./manual-payout-estimate.js";

/** How screens and exports show a manual payout estimate. */
export class ManualPayoutEstimateView {
  codeText: string;
  labelText: string;
  score: string;
  journeyIdText: string;
  country: string;
  frequencyCap: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    score: string,
    journeyIdText: string,
    country: string,
    frequencyCap: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.score = score;
    this.journeyIdText = journeyIdText;
    this.country = country;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toManualPayoutEstimateView(item: ManualPayoutEstimate): ManualPayoutEstimateView {
  return new ManualPayoutEstimateView(
    item.code,
    item.label,
    item.score.toFixed(2),
    text.truncate(item.journeyId, 120),
    item.country,
    String(item.frequencyCap),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPayoutEstimateViews(items: ManualPayoutEstimate[]): ManualPayoutEstimateView[] {
  const views: ManualPayoutEstimateView[] = [];
  for (const item of items) {
    views.push(toManualPayoutEstimateView(item));
  }
  return views;
}

export function sumManualPayoutEstimateView(view: ManualPayoutEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedScore + parsedFrequencyCap + parsedConversionRate;
}
