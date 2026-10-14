import * as text from "../../../../kit/text.js";
import { RegionalApprovalSlot } from "./regional-approval-slot.js";

/** How screens and exports show a regional approval slot. */
export class RegionalApprovalSlotView {
  code: string;
  label: string;
  conversionRateText: string;
  margin: string;
  contactEmailText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    conversionRateText: string,
    margin: string,
    contactEmailText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRateText = conversionRateText;
    this.margin = margin;
    this.contactEmailText = contactEmailText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalApprovalSlotView(item: RegionalApprovalSlot): RegionalApprovalSlotView {
  return new RegionalApprovalSlotView(
    text.truncate(item.code, 80),
    item.label,
    item.conversionRate.toFixed(2),
    item.margin.toFixed(2),
    item.contactEmail,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalApprovalSlotViews(items: RegionalApprovalSlot[]): RegionalApprovalSlotView[] {
  const views: RegionalApprovalSlotView[] = [];
  for (const item of items) {
    views.push(toRegionalApprovalSlotView(item));
  }
  return views;
}

export function sumRegionalApprovalSlotView(view: RegionalApprovalSlotView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedConversionRate + parsedMargin;
}
