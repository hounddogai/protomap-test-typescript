import * as text from "../../../../kit/text.js";
import { TieredInviteProfile } from "./tiered-invite-profile.js";

/** How screens and exports show a tiered invite profile. */
export class TieredInviteProfileView {
  codeText: string;
  title: string;
  expiresAt: string;
  conversionRateText: string;
  country: string;
  attempts: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    expiresAt: string,
    conversionRateText: string,
    country: string,
    attempts: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.expiresAt = expiresAt;
    this.conversionRateText = conversionRateText;
    this.country = country;
    this.attempts = attempts;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toTieredInviteProfileView(item: TieredInviteProfile): TieredInviteProfileView {
  return new TieredInviteProfileView(
    item.code,
    text.truncate(item.title, 80),
    String(item.expiresAt),
    item.conversionRate.toFixed(2),
    text.truncate(item.country, 64),
    String(item.attempts),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredInviteProfileViews(items: TieredInviteProfile[]): TieredInviteProfileView[] {
  const views: TieredInviteProfileView[] = [];
  for (const item of items) {
    views.push(toTieredInviteProfileView(item));
  }
  return views;
}

export function sumTieredInviteProfileView(view: TieredInviteProfileView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedExpiresAt + parsedConversionRate + parsedAttempts;
}
