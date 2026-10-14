import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentMapping } from "./regional-enrollment-mapping.js";

/** How screens and exports show a regional enrollment mapping. */
export class RegionalEnrollmentMappingView {
  code: string;
  labelText: string;
  discountText: string;
  campaignRef: string;
  archivedText: string;
  amountText: string;
  thresholdText: string;
  sourceText: string;
  cohort: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discountText: string,
    campaignRef: string,
    archivedText: string,
    amountText: string,
    thresholdText: string,
    sourceText: string,
    cohort: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discountText = discountText;
    this.campaignRef = campaignRef;
    this.archivedText = archivedText;
    this.amountText = amountText;
    this.thresholdText = thresholdText;
    this.sourceText = sourceText;
    this.cohort = cohort;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalEnrollmentMappingView(item: RegionalEnrollmentMapping): RegionalEnrollmentMappingView {
  return new RegionalEnrollmentMappingView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    item.campaignRef,
    `${item.archived}`,
    item.amount.toFixed(2),
    item.threshold.toFixed(2),
    item.source,
    text.truncate(item.cohort, 40),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalEnrollmentMappingViews(items: RegionalEnrollmentMapping[]): RegionalEnrollmentMappingView[] {
  const views: RegionalEnrollmentMappingView[] = [];
  for (const item of items) {
    views.push(toRegionalEnrollmentMappingView(item));
  }
  return views;
}

export function sumRegionalEnrollmentMappingView(view: RegionalEnrollmentMappingView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedDiscount + parsedAmount + parsedThreshold;
}
