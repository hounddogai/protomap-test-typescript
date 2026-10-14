import * as text from "../../../../kit/text.js";
import { TieredPaywallLedger } from "./tiered-paywall-ledger.js";

/** How screens and exports show a tiered paywall ledger. */
export class TieredPaywallLedgerView {
  code: string;
  name: string;
  revision: string;
  discount: string;
  archived: string;
  currency: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    discount: string,
    archived: string,
    currency: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.discount = discount;
    this.archived = archived;
    this.currency = currency;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPaywallLedgerView(item: TieredPaywallLedger): TieredPaywallLedgerView {
  return new TieredPaywallLedgerView(
    text.truncate(item.code, 80),
    item.name,
    String(item.revision),
    item.discount.toFixed(2),
    `${item.archived}`,
    item.currency,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPaywallLedgerViews(items: TieredPaywallLedger[]): TieredPaywallLedgerView[] {
  const views: TieredPaywallLedgerView[] = [];
  for (const item of items) {
    views.push(toTieredPaywallLedgerView(item));
  }
  return views;
}

export function sumTieredPaywallLedgerView(view: TieredPaywallLedgerView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRevision + parsedDiscount;
}
