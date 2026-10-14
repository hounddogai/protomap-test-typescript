import { AdaptiveActivationOverride } from "./adaptive-activation-override.js";

/** How screens and exports show a adaptive activation override. */
export class AdaptiveActivationOverrideView {
  code: string;
  name: string;
  active: string;
  country: string;
  createdAt: string;
  rate: string;
  phone: string;
  endsAtText: string;
  localeText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    active: string,
    country: string,
    createdAt: string,
    rate: string,
    phone: string,
    endsAtText: string,
    localeText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.country = country;
    this.createdAt = createdAt;
    this.rate = rate;
    this.phone = phone;
    this.endsAtText = endsAtText;
    this.localeText = localeText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveActivationOverrideView(item: AdaptiveActivationOverride): AdaptiveActivationOverrideView {
  return new AdaptiveActivationOverrideView(
    item.code,
    item.name,
    `${item.active}`,
    item.country,
    String(item.createdAt),
    item.rate.toFixed(2),
    item.phone,
    String(item.endsAt),
    item.locale,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveActivationOverrideViews(items: AdaptiveActivationOverride[]): AdaptiveActivationOverrideView[] {
  const views: AdaptiveActivationOverrideView[] = [];
  for (const item of items) {
    views.push(toAdaptiveActivationOverrideView(item));
  }
  return views;
}

export function sumAdaptiveActivationOverrideView(view: AdaptiveActivationOverrideView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedCreatedAt + parsedRate + parsedEndsAt;
}
