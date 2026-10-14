import * as text from "../../../../kit/text.js";
import { ManualPaywallClaim } from "./manual-paywall-claim.js";

/** How screens and exports show a manual paywall claim. */
export class ManualPaywallClaimView {
  codeText: string;
  label: string;
  category: string;
  retries: string;
  clicks: string;
  variant: string;
  expiresAt: string;
  endsAt: string;
  cohort: string;
  maximum: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    category: string,
    retries: string,
    clicks: string,
    variant: string,
    expiresAt: string,
    endsAt: string,
    cohort: string,
    maximum: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.category = category;
    this.retries = retries;
    this.clicks = clicks;
    this.variant = variant;
    this.expiresAt = expiresAt;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.maximum = maximum;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toManualPaywallClaimView(item: ManualPaywallClaim): ManualPaywallClaimView {
  return new ManualPaywallClaimView(
    item.code,
    item.label,
    item.category,
    String(item.retries),
    String(item.clicks),
    text.truncate(item.variant, 80),
    String(item.expiresAt),
    String(item.endsAt),
    item.cohort,
    item.maximum.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPaywallClaimViews(items: ManualPaywallClaim[]): ManualPaywallClaimView[] {
  const views: ManualPaywallClaimView[] = [];
  for (const item of items) {
    views.push(toManualPaywallClaimView(item));
  }
  return views;
}

export function sumManualPaywallClaimView(view: ManualPaywallClaimView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRetries + parsedClicks + parsedExpiresAt;
}
