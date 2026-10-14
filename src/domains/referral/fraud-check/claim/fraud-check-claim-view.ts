import * as text from "../../../../kit/text.js";
import { FraudCheckClaim } from "./fraud-check-claim.js";

/** How screens and exports show a fraud check claim. */
export class FraudCheckClaimView {
  code: string;
  name: string;
  ratio: string;
  clicksText: string;
  graceDays: string;
  checksum: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratio: string,
    clicksText: string,
    graceDays: string,
    checksum: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.clicksText = clicksText;
    this.graceDays = graceDays;
    this.checksum = checksum;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckClaimView(item: FraudCheckClaim): FraudCheckClaimView {
  return new FraudCheckClaimView(
    text.truncate(item.code, 80),
    item.name,
    item.ratio.toFixed(2),
    String(item.clicks),
    String(item.graceDays),
    item.checksum,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckClaimViews(items: FraudCheckClaim[]): FraudCheckClaimView[] {
  const views: FraudCheckClaimView[] = [];
  for (const item of items) {
    views.push(toFraudCheckClaimView(item));
  }
  return views;
}

export function sumFraudCheckClaimView(view: FraudCheckClaimView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedRatio + parsedClicks + parsedGraceDays;
}
