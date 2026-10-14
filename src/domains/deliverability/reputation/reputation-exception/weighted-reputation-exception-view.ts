import * as text from "../../../../kit/text.js";
import { WeightedReputationException } from "./weighted-reputation-exception.js";

/** How screens and exports show a weighted reputation exception. */
export class WeightedReputationExceptionView {
  codeText: string;
  label: string;
  timezoneText: string;
  ratioText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    timezoneText: string,
    ratioText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.timezoneText = timezoneText;
    this.ratioText = ratioText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationExceptionView(item: WeightedReputationException): WeightedReputationExceptionView {
  return new WeightedReputationExceptionView(
    text.truncate(item.code, 40),
    item.label,
    item.timezone,
    item.ratio.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationExceptionViews(items: WeightedReputationException[]): WeightedReputationExceptionView[] {
  const views: WeightedReputationExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationExceptionView(item));
  }
  return views;
}

export function sumWeightedReputationExceptionView(view: WeightedReputationExceptionView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedRatio + parsedDiscount;
}
