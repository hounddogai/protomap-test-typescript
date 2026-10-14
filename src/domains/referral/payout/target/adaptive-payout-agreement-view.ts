import { AdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

/** How screens and exports show a adaptive payout agreement. */
export class AdaptivePayoutAgreementView {
  codeText: string;
  title: string;
  ownerIdText: string;
  impressions: string;
  version: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ownerIdText: string,
    impressions: string,
    version: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ownerIdText = ownerIdText;
    this.impressions = impressions;
    this.version = version;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePayoutAgreementView(item: AdaptivePayoutAgreement): AdaptivePayoutAgreementView {
  return new AdaptivePayoutAgreementView(
    item.code,
    item.title,
    item.ownerId,
    String(item.impressions),
    String(item.version),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePayoutAgreementViews(items: AdaptivePayoutAgreement[]): AdaptivePayoutAgreementView[] {
  const views: AdaptivePayoutAgreementView[] = [];
  for (const item of items) {
    views.push(toAdaptivePayoutAgreementView(item));
  }
  return views;
}

export function sumAdaptivePayoutAgreementView(view: AdaptivePayoutAgreementView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedImpressions + parsedVersion;
}
