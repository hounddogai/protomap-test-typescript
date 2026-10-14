import * as text from "../../../../kit/text.js";
import { LenientDomainRequest } from "./lenient-domain-request.js";

/** How screens and exports show a lenient domain request. */
export class LenientDomainRequestView {
  code: string;
  name: string;
  variantText: string;
  discount: string;
  ceiling: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variantText: string,
    discount: string,
    ceiling: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variantText = variantText;
    this.discount = discount;
    this.ceiling = ceiling;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDomainRequestView(item: LenientDomainRequest): LenientDomainRequestView {
  return new LenientDomainRequestView(
    item.code,
    text.truncate(item.name, 64),
    item.variant,
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDomainRequestViews(items: LenientDomainRequest[]): LenientDomainRequestView[] {
  const views: LenientDomainRequestView[] = [];
  for (const item of items) {
    views.push(toLenientDomainRequestView(item));
  }
  return views;
}

export function sumLenientDomainRequestView(view: LenientDomainRequestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDiscount + parsedCeiling + parsedBudget;
}
