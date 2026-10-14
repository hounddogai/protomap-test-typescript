import * as text from "../../../../kit/text.js";
import { WeightedOptOutProfile } from "./weighted-opt-out-profile.js";

/** How screens and exports show a weighted opt out profile. */
export class WeightedOptOutProfileView {
  code: string;
  labelText: string;
  localeText: string;
  notes: string;
  cohortText: string;
  discount: string;
  capacityText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    localeText: string,
    notes: string,
    cohortText: string,
    discount: string,
    capacityText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.localeText = localeText;
    this.notes = notes;
    this.cohortText = cohortText;
    this.discount = discount;
    this.capacityText = capacityText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedOptOutProfileView(item: WeightedOptOutProfile): WeightedOptOutProfileView {
  return new WeightedOptOutProfileView(
    item.code,
    item.label,
    text.truncate(item.locale, 120),
    item.notes,
    item.cohort,
    item.discount.toFixed(2),
    String(item.capacity),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedOptOutProfileViews(items: WeightedOptOutProfile[]): WeightedOptOutProfileView[] {
  const views: WeightedOptOutProfileView[] = [];
  for (const item of items) {
    views.push(toWeightedOptOutProfileView(item));
  }
  return views;
}

export function sumWeightedOptOutProfileView(view: WeightedOptOutProfileView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedDiscount + parsedCapacity + parsedRatio;
}
