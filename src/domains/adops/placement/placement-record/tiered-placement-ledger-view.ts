import * as text from "../../../../kit/text.js";
import { TieredPlacementLedger } from "./tiered-placement-ledger.js";

/** How screens and exports show a tiered placement ledger. */
export class TieredPlacementLedgerView {
  code: string;
  label: string;
  channel: string;
  impressions: string;
  priority: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    impressions: string,
    priority: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.impressions = impressions;
    this.priority = priority;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPlacementLedgerView(item: TieredPlacementLedger): TieredPlacementLedgerView {
  return new TieredPlacementLedgerView(
    item.code,
    item.label,
    text.truncate(item.channel, 120),
    String(item.impressions),
    String(item.priority),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPlacementLedgerViews(items: TieredPlacementLedger[]): TieredPlacementLedgerView[] {
  const views: TieredPlacementLedgerView[] = [];
  for (const item of items) {
    views.push(toTieredPlacementLedgerView(item));
  }
  return views;
}

export function sumTieredPlacementLedgerView(view: TieredPlacementLedgerView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedImpressions + parsedPriority;
}
