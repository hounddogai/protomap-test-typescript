import * as text from "../../../../kit/text.js";
import { TieredCohortVariance } from "./tiered-cohort-variance.js";

/** How screens and exports show a tiered cohort variance. */
export class TieredCohortVarianceView {
  code: string;
  labelText: string;
  frequencyCap: string;
  unit: string;
  quantity: string;
  phoneText: string;
  weight: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    frequencyCap: string,
    unit: string,
    quantity: string,
    phoneText: string,
    weight: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
    this.quantity = quantity;
    this.phoneText = phoneText;
    this.weight = weight;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortVarianceView(item: TieredCohortVariance): TieredCohortVarianceView {
  return new TieredCohortVarianceView(
    text.truncate(item.code, 80),
    item.label,
    String(item.frequencyCap),
    item.unit,
    String(item.quantity),
    item.phone,
    item.weight.toFixed(2),
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortVarianceViews(items: TieredCohortVariance[]): TieredCohortVarianceView[] {
  const views: TieredCohortVarianceView[] = [];
  for (const item of items) {
    views.push(toTieredCohortVarianceView(item));
  }
  return views;
}

export function sumTieredCohortVarianceView(view: TieredCohortVarianceView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedFrequencyCap + parsedQuantity + parsedWeight;
}
