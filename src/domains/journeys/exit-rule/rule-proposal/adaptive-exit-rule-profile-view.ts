import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

/** How screens and exports show a adaptive exit rule profile. */
export class AdaptiveExitRuleProfileView {
  code: string;
  labelText: string;
  impressions: string;
  frequencyCap: string;
  bid: string;
  externalRef: string;
  cohort: string;
  visible: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    impressions: string,
    frequencyCap: string,
    bid: string,
    externalRef: string,
    cohort: string,
    visible: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.visible = visible;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleProfileView(item: AdaptiveExitRuleProfile): AdaptiveExitRuleProfileView {
  return new AdaptiveExitRuleProfileView(
    item.code,
    item.label,
    String(item.impressions),
    String(item.frequencyCap),
    item.bid.toFixed(2),
    text.truncate(item.externalRef, 80),
    text.truncate(item.cohort, 80),
    `${item.visible}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleProfileViews(items: AdaptiveExitRuleProfile[]): AdaptiveExitRuleProfileView[] {
  const views: AdaptiveExitRuleProfileView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleProfileView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleProfileView(view: AdaptiveExitRuleProfileView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedImpressions + parsedFrequencyCap + parsedBid;
}
