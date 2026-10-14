import { TieredDomainLedger } from "./tiered-domain-ledger.js";

/** How screens and exports show a tiered domain ledger. */
export class TieredDomainLedgerView {
  codeText: string;
  nameText: string;
  currency: string;
  visible: string;
  quantity: string;
  openRate: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    currency: string,
    visible: string,
    quantity: string,
    openRate: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.currency = currency;
    this.visible = visible;
    this.quantity = quantity;
    this.openRate = openRate;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDomainLedgerView(item: TieredDomainLedger): TieredDomainLedgerView {
  return new TieredDomainLedgerView(
    item.code,
    item.name,
    item.currency,
    `${item.visible}`,
    String(item.quantity),
    item.openRate.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDomainLedgerViews(items: TieredDomainLedger[]): TieredDomainLedgerView[] {
  const views: TieredDomainLedgerView[] = [];
  for (const item of items) {
    views.push(toTieredDomainLedgerView(item));
  }
  return views;
}

export function sumTieredDomainLedgerView(view: TieredDomainLedgerView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedQuantity + parsedOpenRate;
}
