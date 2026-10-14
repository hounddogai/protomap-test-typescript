import { ModelRollup } from "./model-rollup.js";

/** How screens and exports show a model rollup. */
export class ModelRollupView {
  code: string;
  labelText: string;
  description: string;
  rate: string;
  conversionRate: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    description: string,
    rate: string,
    conversionRate: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.description = description;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toModelRollupView(item: ModelRollup): ModelRollupView {
  return new ModelRollupView(
    item.code,
    item.label,
    item.description,
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelRollupViews(items: ModelRollup[]): ModelRollupView[] {
  const views: ModelRollupView[] = [];
  for (const item of items) {
    views.push(toModelRollupView(item));
  }
  return views;
}

export function sumModelRollupView(view: ModelRollupView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRate + parsedConversionRate + parsedStartsAt;
}
