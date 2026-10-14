import * as text from "../../../../kit/text.js";
import { InviteMapping } from "./invite-mapping.js";

/** How screens and exports show a invite mapping. */
export class InviteMappingView {
  code: string;
  name: string;
  ceiling: string;
  audienceIdText: string;
  conversionRate: string;
  discount: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ceiling: string,
    audienceIdText: string,
    conversionRate: string,
    discount: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.audienceIdText = audienceIdText;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteMappingView(item: InviteMapping): InviteMappingView {
  return new InviteMappingView(
    item.code,
    text.truncate(item.name, 80),
    item.ceiling.toFixed(2),
    text.truncate(item.audienceId, 80),
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteMappingViews(items: InviteMapping[]): InviteMappingView[] {
  const views: InviteMappingView[] = [];
  for (const item of items) {
    views.push(toInviteMappingView(item));
  }
  return views;
}

export function sumInviteMappingView(view: InviteMappingView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCeiling + parsedConversionRate + parsedDiscount;
}
