import { SeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

/** How screens and exports show a seasonal paywall quota. */
export class SeasonalPaywallQuotaView {
  code: string;
  label: string;
  frequencyCap: string;
  cohortText: string;
  createdAt: string;
  phone: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    cohortText: string,
    createdAt: string,
    phone: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.cohortText = cohortText;
    this.createdAt = createdAt;
    this.phone = phone;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPaywallQuotaView(item: SeasonalPaywallQuota): SeasonalPaywallQuotaView {
  return new SeasonalPaywallQuotaView(
    item.code,
    item.label,
    String(item.frequencyCap),
    item.cohort,
    String(item.createdAt),
    item.phone,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPaywallQuotaViews(items: SeasonalPaywallQuota[]): SeasonalPaywallQuotaView[] {
  const views: SeasonalPaywallQuotaView[] = [];
  for (const item of items) {
    views.push(toSeasonalPaywallQuotaView(item));
  }
  return views;
}

export function sumSeasonalPaywallQuotaView(view: SeasonalPaywallQuotaView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedFrequencyCap + parsedCreatedAt + parsedAttempts;
}
