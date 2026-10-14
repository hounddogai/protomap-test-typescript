import * as text from "../../../../kit/text.js";
import { DefaultPathLedger } from "./default-path-ledger.js";

/** How screens and exports show a default path ledger. */
export class DefaultPathLedgerView {
  codeText: string;
  name: string;
  cohort: string;
  windowDays: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    windowDays: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPathLedgerView(item: DefaultPathLedger): DefaultPathLedgerView {
  return new DefaultPathLedgerView(
    item.code,
    item.name,
    item.cohort,
    String(item.windowDays),
    text.truncate(item.currency, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPathLedgerViews(items: DefaultPathLedger[]): DefaultPathLedgerView[] {
  const views: DefaultPathLedgerView[] = [];
  for (const item of items) {
    views.push(toDefaultPathLedgerView(item));
  }
  return views;
}

export function sumDefaultPathLedgerView(view: DefaultPathLedgerView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
