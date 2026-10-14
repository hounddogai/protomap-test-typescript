import { ScheduledTierLedger } from "./scheduled-tier-ledger.js";

/** How screens and exports show a scheduled tier ledger. */
export class ScheduledTierLedgerView {
  code: string;
  nameText: string;
  weight: string;
  contactEmail: string;
  campaignRefText: string;
  amount: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    weight: string,
    contactEmail: string,
    campaignRefText: string,
    amount: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.weight = weight;
    this.contactEmail = contactEmail;
    this.campaignRefText = campaignRefText;
    this.amount = amount;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledTierLedgerView(item: ScheduledTierLedger): ScheduledTierLedgerView {
  return new ScheduledTierLedgerView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    item.contactEmail,
    item.campaignRef,
    item.amount.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledTierLedgerViews(items: ScheduledTierLedger[]): ScheduledTierLedgerView[] {
  const views: ScheduledTierLedgerView[] = [];
  for (const item of items) {
    views.push(toScheduledTierLedgerView(item));
  }
  return views;
}

export function sumScheduledTierLedgerView(view: ScheduledTierLedgerView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedWeight + parsedAmount + parsedImpressions;
}
