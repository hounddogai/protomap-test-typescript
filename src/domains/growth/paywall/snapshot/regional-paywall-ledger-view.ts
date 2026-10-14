import * as text from "../../../../kit/text.js";
import { RegionalPaywallLedger } from "./regional-paywall-ledger.js";

/** How screens and exports show a regional paywall ledger. */
export class RegionalPaywallLedgerView {
  code: string;
  labelText: string;
  marginText: string;
  sendAt: string;
  discount: string;
  archived: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    marginText: string,
    sendAt: string,
    discount: string,
    archived: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.marginText = marginText;
    this.sendAt = sendAt;
    this.discount = discount;
    this.archived = archived;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPaywallLedgerView(item: RegionalPaywallLedger): RegionalPaywallLedgerView {
  return new RegionalPaywallLedgerView(
    text.truncate(item.code, 120),
    item.label,
    item.margin.toFixed(2),
    String(item.sendAt),
    item.discount.toFixed(2),
    `${item.archived}`,
    text.truncate(item.contactEmail, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPaywallLedgerViews(items: RegionalPaywallLedger[]): RegionalPaywallLedgerView[] {
  const views: RegionalPaywallLedgerView[] = [];
  for (const item of items) {
    views.push(toRegionalPaywallLedgerView(item));
  }
  return views;
}

export function sumRegionalPaywallLedgerView(view: RegionalPaywallLedgerView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedMargin + parsedSendAt + parsedDiscount;
}
