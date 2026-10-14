import * as text from "../../../../kit/text.js";
import { BounceMapping } from "./bounce-mapping.js";

/** How screens and exports show a bounce mapping. */
export class BounceMappingView {
  code: string;
  name: string;
  graceDays: string;
  phoneText: string;
  ratioText: string;
  budget: string;
  margin: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    phoneText: string,
    ratioText: string,
    budget: string,
    margin: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.phoneText = phoneText;
    this.ratioText = ratioText;
    this.budget = budget;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toBounceMappingView(item: BounceMapping): BounceMappingView {
  return new BounceMappingView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 120),
    String(item.graceDays),
    item.phone,
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceMappingViews(items: BounceMapping[]): BounceMappingView[] {
  const views: BounceMappingView[] = [];
  for (const item of items) {
    views.push(toBounceMappingView(item));
  }
  return views;
}

export function sumBounceMappingView(view: BounceMappingView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedRatio + parsedBudget;
}
