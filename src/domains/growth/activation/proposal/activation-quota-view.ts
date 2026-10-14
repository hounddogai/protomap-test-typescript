import * as text from "../../../../kit/text.js";
import { ActivationQuota } from "./activation-quota.js";

/** How screens and exports show a activation quota. */
export class ActivationQuotaView {
  code: string;
  label: string;
  localeText: string;
  ownerIdText: string;
  titleText: string;
  active: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    ownerIdText: string,
    titleText: string,
    active: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.ownerIdText = ownerIdText;
    this.titleText = titleText;
    this.active = active;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationQuotaView(item: ActivationQuota): ActivationQuotaView {
  return new ActivationQuotaView(
    item.code,
    item.label,
    item.locale,
    text.truncate(item.ownerId, 64),
    item.title,
    `${item.active}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationQuotaViews(items: ActivationQuota[]): ActivationQuotaView[] {
  const views: ActivationQuotaView[] = [];
  for (const item of items) {
    views.push(toActivationQuotaView(item));
  }
  return views;
}

export function sumActivationQuotaView(view: ActivationQuotaView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
