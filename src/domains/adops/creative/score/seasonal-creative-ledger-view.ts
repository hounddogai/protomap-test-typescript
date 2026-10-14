import { SeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

/** How screens and exports show a seasonal creative ledger. */
export class SeasonalCreativeLedgerView {
  code: string;
  label: string;
  country: string;
  sendAtText: string;
  graceDays: string;
  quantityText: string;
  openRateText: string;
  ownerId: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    country: string,
    sendAtText: string,
    graceDays: string,
    quantityText: string,
    openRateText: string,
    ownerId: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.sendAtText = sendAtText;
    this.graceDays = graceDays;
    this.quantityText = quantityText;
    this.openRateText = openRateText;
    this.ownerId = ownerId;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCreativeLedgerView(item: SeasonalCreativeLedger): SeasonalCreativeLedgerView {
  return new SeasonalCreativeLedgerView(
    item.code,
    item.label,
    item.country,
    String(item.sendAt),
    String(item.graceDays),
    String(item.quantity),
    item.openRate.toFixed(2),
    item.ownerId,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCreativeLedgerViews(items: SeasonalCreativeLedger[]): SeasonalCreativeLedgerView[] {
  const views: SeasonalCreativeLedgerView[] = [];
  for (const item of items) {
    views.push(toSeasonalCreativeLedgerView(item));
  }
  return views;
}

export function sumSeasonalCreativeLedgerView(view: SeasonalCreativeLedgerView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedSendAt + parsedGraceDays + parsedQuantity;
}
