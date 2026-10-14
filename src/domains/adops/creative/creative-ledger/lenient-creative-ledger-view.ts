import * as text from "../../../../kit/text.js";
import { LenientCreativeLedger } from "./lenient-creative-ledger.js";

/** How screens and exports show a lenient creative ledger. */
export class LenientCreativeLedgerView {
  codeText: string;
  title: string;
  checksum: string;
  reviewer: string;
  updatedAt: string;
  category: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    checksum: string,
    reviewer: string,
    updatedAt: string,
    category: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.category = category;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreativeLedgerView(item: LenientCreativeLedger): LenientCreativeLedgerView {
  return new LenientCreativeLedgerView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    text.truncate(item.checksum, 80),
    text.truncate(item.reviewer, 120),
    String(item.updatedAt),
    item.category,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreativeLedgerViews(items: LenientCreativeLedger[]): LenientCreativeLedgerView[] {
  const views: LenientCreativeLedgerView[] = [];
  for (const item of items) {
    views.push(toLenientCreativeLedgerView(item));
  }
  return views;
}

export function sumLenientCreativeLedgerView(view: LenientCreativeLedgerView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedUpdatedAt + parsedCreatedAt;
}
