import * as text from "../../../../kit/text.js";
import { FrequencyAgreement } from "./frequency-agreement.js";

/** How screens and exports show a frequency agreement. */
export class FrequencyAgreementView {
  code: string;
  labelText: string;
  version: string;
  expiresAt: string;
  discount: string;
  contactEmail: string;
  impressions: string;
  maximumText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    expiresAt: string,
    discount: string,
    contactEmail: string,
    impressions: string,
    maximumText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.maximumText = maximumText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyAgreementView(item: FrequencyAgreement): FrequencyAgreementView {
  return new FrequencyAgreementView(
    item.code,
    text.truncate(item.label, 40),
    String(item.version),
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.contactEmail,
    String(item.impressions),
    item.maximum.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyAgreementViews(items: FrequencyAgreement[]): FrequencyAgreementView[] {
  const views: FrequencyAgreementView[] = [];
  for (const item of items) {
    views.push(toFrequencyAgreementView(item));
  }
  return views;
}

export function sumFrequencyAgreementView(view: FrequencyAgreementView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedVersion + parsedExpiresAt + parsedDiscount;
}
