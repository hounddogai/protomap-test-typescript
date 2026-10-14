import { ScheduledReputationPreference } from "./scheduled-reputation-preference.js";

/** How screens and exports show a scheduled reputation preference. */
export class ScheduledReputationPreferenceView {
  code: string;
  name: string;
  campaignRef: string;
  frequencyCap: string;
  conversionRate: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    frequencyCap: string,
    conversionRate: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledReputationPreferenceView(item: ScheduledReputationPreference): ScheduledReputationPreferenceView {
  return new ScheduledReputationPreferenceView(
    item.code,
    item.name,
    item.campaignRef,
    String(item.frequencyCap),
    item.conversionRate.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledReputationPreferenceViews(items: ScheduledReputationPreference[]): ScheduledReputationPreferenceView[] {
  const views: ScheduledReputationPreferenceView[] = [];
  for (const item of items) {
    views.push(toScheduledReputationPreferenceView(item));
  }
  return views;
}

export function sumScheduledReputationPreferenceView(view: ScheduledReputationPreferenceView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedFrequencyCap + parsedConversionRate + parsedBatchSize;
}
