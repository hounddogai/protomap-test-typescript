import * as text from "../../../../kit/text.js";
import { LenientConversionPolicy } from "./lenient-conversion-policy.js";

/** How screens and exports show a lenient conversion policy. */
export class LenientConversionPolicyView {
  code: string;
  name: string;
  journeyId: string;
  currency: string;
  revision: string;
  openRateText: string;
  segment: string;
  summaryText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    currency: string,
    revision: string,
    openRateText: string,
    segment: string,
    summaryText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.currency = currency;
    this.revision = revision;
    this.openRateText = openRateText;
    this.segment = segment;
    this.summaryText = summaryText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientConversionPolicyView(item: LenientConversionPolicy): LenientConversionPolicyView {
  return new LenientConversionPolicyView(
    item.code,
    text.truncate(item.name, 80),
    item.journeyId,
    item.currency,
    String(item.revision),
    item.openRate.toFixed(2),
    item.segment,
    item.summary,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientConversionPolicyViews(items: LenientConversionPolicy[]): LenientConversionPolicyView[] {
  const views: LenientConversionPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientConversionPolicyView(item));
  }
  return views;
}

export function sumLenientConversionPolicyView(view: LenientConversionPolicyView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedRevision + parsedOpenRate + parsedDiscount;
}
