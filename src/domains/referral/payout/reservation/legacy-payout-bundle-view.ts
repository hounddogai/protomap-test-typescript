import * as text from "../../../../kit/text.js";
import { LegacyPayoutBundle } from "./legacy-payout-bundle.js";

/** How screens and exports show a legacy payout bundle. */
export class LegacyPayoutBundleView {
  codeText: string;
  label: string;
  campaignRef: string;
  phone: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRef: string,
    phone: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.phone = phone;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPayoutBundleView(item: LegacyPayoutBundle): LegacyPayoutBundleView {
  return new LegacyPayoutBundleView(
    item.code,
    item.label,
    item.campaignRef,
    text.truncate(item.phone, 120),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPayoutBundleViews(items: LegacyPayoutBundle[]): LegacyPayoutBundleView[] {
  const views: LegacyPayoutBundleView[] = [];
  for (const item of items) {
    views.push(toLegacyPayoutBundleView(item));
  }
  return views;
}

export function sumLegacyPayoutBundleView(view: LegacyPayoutBundleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
