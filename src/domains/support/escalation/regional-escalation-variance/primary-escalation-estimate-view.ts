import * as text from "../../../../kit/text.js";
import { PrimaryEscalationEstimate } from "./primary-escalation-estimate.js";

/** How screens and exports show a primary escalation estimate. */
export class PrimaryEscalationEstimateView {
  codeText: string;
  titleText: string;
  ratio: string;
  conversionRate: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    ratio: string,
    conversionRate: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryEscalationEstimateView(item: PrimaryEscalationEstimate): PrimaryEscalationEstimateView {
  return new PrimaryEscalationEstimateView(
    text.truncate(item.code, 40),
    item.title,
    item.ratio.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryEscalationEstimateViews(items: PrimaryEscalationEstimate[]): PrimaryEscalationEstimateView[] {
  const views: PrimaryEscalationEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryEscalationEstimateView(item));
  }
  return views;
}

export function sumPrimaryEscalationEstimateView(view: PrimaryEscalationEstimateView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRatio + parsedConversionRate + parsedImpressions;
}
