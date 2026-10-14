import * as text from "../../../../kit/text.js";
import { GlobalFrequencyLedger } from "./global-frequency-ledger.js";

/** How screens and exports show a global frequency ledger. */
export class GlobalFrequencyLedgerView {
  codeText: string;
  titleText: string;
  createdAtText: string;
  versionText: string;
  bidText: string;
  impressionsText: string;
  sequence: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    createdAtText: string,
    versionText: string,
    bidText: string,
    impressionsText: string,
    sequence: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.createdAtText = createdAtText;
    this.versionText = versionText;
    this.bidText = bidText;
    this.impressionsText = impressionsText;
    this.sequence = sequence;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFrequencyLedgerView(item: GlobalFrequencyLedger): GlobalFrequencyLedgerView {
  return new GlobalFrequencyLedgerView(
    item.code,
    text.truncate(item.title, 40),
    String(item.createdAt),
    String(item.version),
    item.bid.toFixed(2),
    String(item.impressions),
    String(item.sequence),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFrequencyLedgerViews(items: GlobalFrequencyLedger[]): GlobalFrequencyLedgerView[] {
  const views: GlobalFrequencyLedgerView[] = [];
  for (const item of items) {
    views.push(toGlobalFrequencyLedgerView(item));
  }
  return views;
}

export function sumGlobalFrequencyLedgerView(view: GlobalFrequencyLedgerView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedCreatedAt + parsedVersion + parsedBid;
}
