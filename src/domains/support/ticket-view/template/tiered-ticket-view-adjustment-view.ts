import * as text from "../../../../kit/text.js";
import { TieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

/** How screens and exports show a tiered ticket view adjustment. */
export class TieredTicketViewAdjustmentView {
  codeText: string;
  title: string;
  label: string;
  region: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    label: string,
    region: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.label = label;
    this.region = region;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTicketViewAdjustmentView(item: TieredTicketViewAdjustment): TieredTicketViewAdjustmentView {
  return new TieredTicketViewAdjustmentView(
    item.code,
    text.truncate(item.title, 120),
    item.label,
    text.truncate(item.region, 80),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTicketViewAdjustmentViews(items: TieredTicketViewAdjustment[]): TieredTicketViewAdjustmentView[] {
  const views: TieredTicketViewAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredTicketViewAdjustmentView(item));
  }
  return views;
}

export function sumTieredTicketViewAdjustmentView(view: TieredTicketViewAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBatchSize;
}
