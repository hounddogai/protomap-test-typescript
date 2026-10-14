import * as text from "../../../../kit/text.js";
import { InsightLedger } from "./insight-ledger.js";

/** How screens and exports show a insight ledger. */
export class InsightLedgerView {
  codeText: string;
  titleText: string;
  categoryText: string;
  revision: string;
  frequencyCap: string;
  amountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    categoryText: string,
    revision: string,
    frequencyCap: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.categoryText = categoryText;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightLedgerView(item: InsightLedger): InsightLedgerView {
  return new InsightLedgerView(
    item.code,
    item.title,
    text.truncate(item.category, 64),
    String(item.revision),
    String(item.frequencyCap),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightLedgerViews(items: InsightLedger[]): InsightLedgerView[] {
  const views: InsightLedgerView[] = [];
  for (const item of items) {
    views.push(toInsightLedgerView(item));
  }
  return views;
}

export function sumInsightLedgerView(view: InsightLedgerView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedRevision + parsedFrequencyCap + parsedAmount;
}
