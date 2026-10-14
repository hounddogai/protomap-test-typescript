import * as text from "../../../../kit/text.js";
import { FallbackModelLedger } from "./fallback-model-ledger.js";

/** How screens and exports show a fallback model ledger. */
export class FallbackModelLedgerView {
  code: string;
  nameText: string;
  floorValue: string;
  unit: string;
  checksum: string;
  externalRefText: string;
  updatedAt: string;
  cohort: string;
  notes: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    floorValue: string,
    unit: string,
    checksum: string,
    externalRefText: string,
    updatedAt: string,
    cohort: string,
    notes: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.floorValue = floorValue;
    this.unit = unit;
    this.checksum = checksum;
    this.externalRefText = externalRefText;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.notes = notes;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackModelLedgerView(item: FallbackModelLedger): FallbackModelLedgerView {
  return new FallbackModelLedgerView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    text.truncate(item.unit, 64),
    text.truncate(item.checksum, 120),
    text.truncate(item.externalRef, 64),
    String(item.updatedAt),
    item.cohort,
    text.truncate(item.notes, 120),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackModelLedgerViews(items: FallbackModelLedger[]): FallbackModelLedgerView[] {
  const views: FallbackModelLedgerView[] = [];
  for (const item of items) {
    views.push(toFallbackModelLedgerView(item));
  }
  return views;
}

export function sumFallbackModelLedgerView(view: FallbackModelLedgerView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedFloorValue + parsedUpdatedAt;
}
