import * as text from "../../../../kit/text.js";
import { ManualPaywallVariance } from "./manual-paywall-variance.js";

/** How screens and exports show a manual paywall variance. */
export class ManualPaywallVarianceView {
  code: string;
  label: string;
  endsAt: string;
  ratio: string;
  utmSource: string;
  currency: string;
  source: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    ratio: string,
    utmSource: string,
    currency: string,
    source: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.currency = currency;
    this.source = source;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toManualPaywallVarianceView(item: ManualPaywallVariance): ManualPaywallVarianceView {
  return new ManualPaywallVarianceView(
    item.code,
    item.label,
    String(item.endsAt),
    item.ratio.toFixed(2),
    text.truncate(item.utmSource, 80),
    text.truncate(item.currency, 80),
    item.source,
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPaywallVarianceViews(items: ManualPaywallVariance[]): ManualPaywallVarianceView[] {
  const views: ManualPaywallVarianceView[] = [];
  for (const item of items) {
    views.push(toManualPaywallVarianceView(item));
  }
  return views;
}

export function sumManualPaywallVarianceView(view: ManualPaywallVarianceView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedEndsAt + parsedRatio;
}
