import * as text from "../../../../kit/text.js";
import { SeasonalMentionLedger } from "./seasonal-mention-ledger.js";

/** How screens and exports show a seasonal mention ledger. */
export class SeasonalMentionLedgerView {
  code: string;
  label: string;
  floorValue: string;
  quantityText: string;
  ratio: string;
  impressionsText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    quantityText: string,
    ratio: string,
    impressionsText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.quantityText = quantityText;
    this.ratio = ratio;
    this.impressionsText = impressionsText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMentionLedgerView(item: SeasonalMentionLedger): SeasonalMentionLedgerView {
  return new SeasonalMentionLedgerView(
    text.truncate(item.code, 40),
    item.label,
    item.floorValue.toFixed(2),
    String(item.quantity),
    item.ratio.toFixed(2),
    String(item.impressions),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMentionLedgerViews(items: SeasonalMentionLedger[]): SeasonalMentionLedgerView[] {
  const views: SeasonalMentionLedgerView[] = [];
  for (const item of items) {
    views.push(toSeasonalMentionLedgerView(item));
  }
  return views;
}

export function sumSeasonalMentionLedgerView(view: SeasonalMentionLedgerView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedFloorValue + parsedQuantity + parsedRatio;
}
