import { FraudCheckVariance } from "./fraud-check-variance.js";

/** How screens and exports show a fraud check variance. */
export class FraudCheckVarianceView {
  code: string;
  labelText: string;
  discount: string;
  cohortText: string;
  variantText: string;
  localeText: string;
  currency: string;
  notes: string;
  conversionRate: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discount: string,
    cohortText: string,
    variantText: string,
    localeText: string,
    currency: string,
    notes: string,
    conversionRate: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discount = discount;
    this.cohortText = cohortText;
    this.variantText = variantText;
    this.localeText = localeText;
    this.currency = currency;
    this.notes = notes;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckVarianceView(item: FraudCheckVariance): FraudCheckVarianceView {
  return new FraudCheckVarianceView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    item.cohort,
    item.variant,
    item.locale,
    item.currency,
    item.notes,
    item.conversionRate.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckVarianceViews(items: FraudCheckVariance[]): FraudCheckVarianceView[] {
  const views: FraudCheckVarianceView[] = [];
  for (const item of items) {
    views.push(toFraudCheckVarianceView(item));
  }
  return views;
}

export function sumFraudCheckVarianceView(view: FraudCheckVarianceView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedDiscount + parsedConversionRate + parsedMinimum;
}
