import * as text from "../../../../kit/text.js";
import { CsatLedger } from "./csat-ledger.js";

/** How screens and exports show a csat ledger. */
export class CsatLedgerView {
  codeText: string;
  name: string;
  ratio: string;
  impressionsText: string;
  minimum: string;
  expiresAt: string;
  capacity: string;
  clicksText: string;
  versionText: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratio: string,
    impressionsText: string,
    minimum: string,
    expiresAt: string,
    capacity: string,
    clicksText: string,
    versionText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratio = ratio;
    this.impressionsText = impressionsText;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.clicksText = clicksText;
    this.versionText = versionText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toCsatLedgerView(item: CsatLedger): CsatLedgerView {
  return new CsatLedgerView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    item.ratio.toFixed(2),
    String(item.impressions),
    item.minimum.toFixed(2),
    String(item.expiresAt),
    String(item.capacity),
    String(item.clicks),
    String(item.version),
    text.truncate(item.phone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatLedgerViews(items: CsatLedger[]): CsatLedgerView[] {
  const views: CsatLedgerView[] = [];
  for (const item of items) {
    views.push(toCsatLedgerView(item));
  }
  return views;
}

export function sumCsatLedgerView(view: CsatLedgerView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRatio + parsedImpressions + parsedMinimum;
}
