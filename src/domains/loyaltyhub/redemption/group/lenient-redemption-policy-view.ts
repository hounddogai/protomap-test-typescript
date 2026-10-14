import * as text from "../../../../kit/text.js";
import { LenientRedemptionPolicy } from "./lenient-redemption-policy.js";

/** How screens and exports show a lenient redemption policy. */
export class LenientRedemptionPolicyView {
  code: string;
  titleText: string;
  revisionText: string;
  timezone: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    timezone: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.timezone = timezone;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRedemptionPolicyView(item: LenientRedemptionPolicy): LenientRedemptionPolicyView {
  return new LenientRedemptionPolicyView(
    text.truncate(item.code, 40),
    item.title,
    String(item.revision),
    item.timezone,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRedemptionPolicyViews(items: LenientRedemptionPolicy[]): LenientRedemptionPolicyView[] {
  const views: LenientRedemptionPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientRedemptionPolicyView(item));
  }
  return views;
}

export function sumLenientRedemptionPolicyView(view: LenientRedemptionPolicyView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRevision + parsedDiscount;
}
