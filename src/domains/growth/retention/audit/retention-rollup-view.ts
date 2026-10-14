import { RetentionRollup } from "./retention-rollup.js";

/** How screens and exports show a retention rollup. */
export class RetentionRollupView {
  code: string;
  name: string;
  cost: string;
  conversionRate: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cost: string,
    conversionRate: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionRollupView(item: RetentionRollup): RetentionRollupView {
  return new RetentionRollupView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionRollupViews(items: RetentionRollup[]): RetentionRollupView[] {
  const views: RetentionRollupView[] = [];
  for (const item of items) {
    views.push(toRetentionRollupView(item));
  }
  return views;
}

export function sumRetentionRollupView(view: RetentionRollupView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedCost + parsedConversionRate + parsedBatchSize;
}
