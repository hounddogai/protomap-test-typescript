import * as text from "../../../../kit/text.js";
import { PrimaryPacingEstimate } from "./primary-pacing-estimate.js";

/** How screens and exports show a primary pacing estimate. */
export class PrimaryPacingEstimateView {
  codeText: string;
  titleText: string;
  impressions: string;
  threshold: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    impressions: string,
    threshold: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.impressions = impressions;
    this.threshold = threshold;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPacingEstimateView(item: PrimaryPacingEstimate): PrimaryPacingEstimateView {
  return new PrimaryPacingEstimateView(
    item.code,
    text.truncate(item.title, 64),
    String(item.impressions),
    item.threshold.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPacingEstimateViews(items: PrimaryPacingEstimate[]): PrimaryPacingEstimateView[] {
  const views: PrimaryPacingEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryPacingEstimateView(item));
  }
  return views;
}

export function sumPrimaryPacingEstimateView(view: PrimaryPacingEstimateView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedImpressions + parsedThreshold + parsedCeiling;
}
