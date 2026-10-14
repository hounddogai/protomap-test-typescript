import { RedemptionLedger } from "./redemption-ledger.js";

/** How screens and exports show a redemption ledger. */
export class RedemptionLedgerView {
  code: string;
  nameText: string;
  source: string;
  conversionRate: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    conversionRate: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionLedgerView(item: RedemptionLedger): RedemptionLedgerView {
  return new RedemptionLedgerView(
    item.code,
    item.name,
    item.source,
    item.conversionRate.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionLedgerViews(items: RedemptionLedger[]): RedemptionLedgerView[] {
  const views: RedemptionLedgerView[] = [];
  for (const item of items) {
    views.push(toRedemptionLedgerView(item));
  }
  return views;
}

export function sumRedemptionLedgerView(view: RedemptionLedgerView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
