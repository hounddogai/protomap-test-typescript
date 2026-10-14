import { WeightedFunnelTarget } from "./weighted-funnel-target.js";

/** How screens and exports show a weighted funnel target. */
export class WeightedFunnelTargetView {
  codeText: string;
  name: string;
  approved: string;
  checksum: string;
  batchSize: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    approved: string,
    checksum: string,
    batchSize: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.approved = approved;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFunnelTargetView(item: WeightedFunnelTarget): WeightedFunnelTargetView {
  return new WeightedFunnelTargetView(
    item.code,
    item.name,
    `${item.approved}`,
    item.checksum,
    String(item.batchSize),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFunnelTargetViews(items: WeightedFunnelTarget[]): WeightedFunnelTargetView[] {
  const views: WeightedFunnelTargetView[] = [];
  for (const item of items) {
    views.push(toWeightedFunnelTargetView(item));
  }
  return views;
}

export function sumWeightedFunnelTargetView(view: WeightedFunnelTargetView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedBatchSize + parsedConversionRate;
}
