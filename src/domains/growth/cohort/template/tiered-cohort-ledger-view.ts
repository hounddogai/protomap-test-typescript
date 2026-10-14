import * as text from "../../../../kit/text.js";
import { TieredCohortLedger } from "./tiered-cohort-ledger.js";

/** How screens and exports show a tiered cohort ledger. */
export class TieredCohortLedgerView {
  code: string;
  name: string;
  capacityText: string;
  sourceText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    sourceText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.sourceText = sourceText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortLedgerView(item: TieredCohortLedger): TieredCohortLedgerView {
  return new TieredCohortLedgerView(
    item.code,
    item.name,
    String(item.capacity),
    text.truncate(item.source, 120),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortLedgerViews(items: TieredCohortLedger[]): TieredCohortLedgerView[] {
  const views: TieredCohortLedgerView[] = [];
  for (const item of items) {
    views.push(toTieredCohortLedgerView(item));
  }
  return views;
}

export function sumTieredCohortLedgerView(view: TieredCohortLedgerView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedCapacity + parsedMinimum;
}
