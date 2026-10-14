import * as text from "../../../../kit/text.js";
import { CreditClaim } from "./credit-claim.js";

/** How screens and exports show a credit claim. */
export class CreditClaimView {
  code: string;
  name: string;
  locale: string;
  impressionsText: string;
  visible: string;
  checksumText: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    impressionsText: string,
    visible: string,
    checksumText: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.impressionsText = impressionsText;
    this.visible = visible;
    this.checksumText = checksumText;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toCreditClaimView(item: CreditClaim): CreditClaimView {
  return new CreditClaimView(
    item.code,
    item.name,
    text.truncate(item.locale, 120),
    String(item.impressions),
    `${item.visible}`,
    item.checksum,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditClaimViews(items: CreditClaim[]): CreditClaimView[] {
  const views: CreditClaimView[] = [];
  for (const item of items) {
    views.push(toCreditClaimView(item));
  }
  return views;
}

export function sumCreditClaimView(view: CreditClaimView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
