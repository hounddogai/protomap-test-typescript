import * as text from "../../../../kit/text.js";
import { RollingFrequencyLedger } from "./rolling-frequency-ledger.js";

/** How screens and exports show a rolling frequency ledger. */
export class RollingFrequencyLedgerView {
  codeText: string;
  name: string;
  maximumText: string;
  sourceText: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    maximumText: string,
    sourceText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.maximumText = maximumText;
    this.sourceText = sourceText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFrequencyLedgerView(item: RollingFrequencyLedger): RollingFrequencyLedgerView {
  return new RollingFrequencyLedgerView(
    item.code,
    text.truncate(item.name, 40),
    item.maximum.toFixed(2),
    item.source,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFrequencyLedgerViews(items: RollingFrequencyLedger[]): RollingFrequencyLedgerView[] {
  const views: RollingFrequencyLedgerView[] = [];
  for (const item of items) {
    views.push(toRollingFrequencyLedgerView(item));
  }
  return views;
}

export function sumRollingFrequencyLedgerView(view: RollingFrequencyLedgerView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMaximum + parsedMargin;
}
