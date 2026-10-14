import * as text from "../../../../kit/text.js";
import { PendingPaywallAdjustment } from "./pending-paywall-adjustment.js";

/** How screens and exports show a pending paywall adjustment. */
export class PendingPaywallAdjustmentView {
  code: string;
  nameText: string;
  segment: string;
  phoneText: string;
  visible: string;
  batchSize: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    segment: string,
    phoneText: string,
    visible: string,
    batchSize: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.segment = segment;
    this.phoneText = phoneText;
    this.visible = visible;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPaywallAdjustmentView(item: PendingPaywallAdjustment): PendingPaywallAdjustmentView {
  return new PendingPaywallAdjustmentView(
    item.code,
    item.name,
    text.truncate(item.segment, 40),
    item.phone,
    `${item.visible}`,
    String(item.batchSize),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPaywallAdjustmentViews(items: PendingPaywallAdjustment[]): PendingPaywallAdjustmentView[] {
  const views: PendingPaywallAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPendingPaywallAdjustmentView(item));
  }
  return views;
}

export function sumPendingPaywallAdjustmentView(view: PendingPaywallAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBatchSize + parsedGraceDays;
}
