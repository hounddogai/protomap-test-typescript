import { CappedRewardSummary } from "./capped-reward-summary.js";

/** How screens and exports show a capped reward summary. */
export class CappedRewardSummaryView {
  codeText: string;
  label: string;
  journeyIdText: string;
  floorValue: string;
  summary: string;
  conversionRate: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    journeyIdText: string,
    floorValue: string,
    summary: string,
    conversionRate: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.journeyIdText = journeyIdText;
    this.floorValue = floorValue;
    this.summary = summary;
    this.conversionRate = conversionRate;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedRewardSummaryView(item: CappedRewardSummary): CappedRewardSummaryView {
  return new CappedRewardSummaryView(
    item.code,
    item.label,
    item.journeyId,
    item.floorValue.toFixed(2),
    item.summary,
    item.conversionRate.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedRewardSummaryViews(items: CappedRewardSummary[]): CappedRewardSummaryView[] {
  const views: CappedRewardSummaryView[] = [];
  for (const item of items) {
    views.push(toCappedRewardSummaryView(item));
  }
  return views;
}

export function sumCappedRewardSummaryView(view: CappedRewardSummaryView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedFloorValue + parsedConversionRate;
}
