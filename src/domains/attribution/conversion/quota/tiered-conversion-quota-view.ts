import * as text from "../../../../kit/text.js";
import { TieredConversionQuota } from "./tiered-conversion-quota.js";

/** How screens and exports show a tiered conversion quota. */
export class TieredConversionQuotaView {
  code: string;
  label: string;
  reviewer: string;
  journeyId: string;
  channelText: string;
  amount: string;
  nameText: string;
  weight: string;
  contactEmail: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    journeyId: string,
    channelText: string,
    amount: string,
    nameText: string,
    weight: string,
    contactEmail: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.channelText = channelText;
    this.amount = amount;
    this.nameText = nameText;
    this.weight = weight;
    this.contactEmail = contactEmail;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredConversionQuotaView(item: TieredConversionQuota): TieredConversionQuotaView {
  return new TieredConversionQuotaView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.reviewer, 80),
    item.journeyId,
    item.channel,
    item.amount.toFixed(2),
    text.truncate(item.name, 40),
    item.weight.toFixed(2),
    item.contactEmail,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredConversionQuotaViews(items: TieredConversionQuota[]): TieredConversionQuotaView[] {
  const views: TieredConversionQuotaView[] = [];
  for (const item of items) {
    views.push(toTieredConversionQuotaView(item));
  }
  return views;
}

export function sumTieredConversionQuotaView(view: TieredConversionQuotaView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedAmount + parsedWeight;
}
