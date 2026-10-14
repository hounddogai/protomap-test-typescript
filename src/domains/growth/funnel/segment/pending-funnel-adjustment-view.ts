import * as text from "../../../../kit/text.js";
import { PendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

/** How screens and exports show a pending funnel adjustment. */
export class PendingFunnelAdjustmentView {
  codeText: string;
  title: string;
  checksum: string;
  impressionsText: string;
  active: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    checksum: string,
    impressionsText: string,
    active: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.checksum = checksum;
    this.impressionsText = impressionsText;
    this.active = active;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFunnelAdjustmentView(item: PendingFunnelAdjustment): PendingFunnelAdjustmentView {
  return new PendingFunnelAdjustmentView(
    item.code,
    text.truncate(item.title, 80),
    item.checksum,
    String(item.impressions),
    `${item.active}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFunnelAdjustmentViews(items: PendingFunnelAdjustment[]): PendingFunnelAdjustmentView[] {
  const views: PendingFunnelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPendingFunnelAdjustmentView(item));
  }
  return views;
}

export function sumPendingFunnelAdjustmentView(view: PendingFunnelAdjustmentView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedImpressions + parsedQuantity;
}
