import { BidRuleLedger } from "./bid-rule-ledger.js";

/** How screens and exports show a bid rule ledger. */
export class BidRuleLedgerView {
  code: string;
  label: string;
  batchSize: string;
  notesText: string;
  statusLabel: string;

  constructor(code: string, label: string, batchSize: string, notesText: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleLedgerView(item: BidRuleLedger): BidRuleLedgerView {
  return new BidRuleLedgerView(
    item.code,
    item.label,
    String(item.batchSize),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleLedgerViews(items: BidRuleLedger[]): BidRuleLedgerView[] {
  const views: BidRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toBidRuleLedgerView(item));
  }
  return views;
}

export function sumBidRuleLedgerView(view: BidRuleLedgerView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
