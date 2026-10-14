import { PayoutAdjustment } from "./payout-adjustment.js";

/** How screens and exports show a payout adjustment. */
export class PayoutAdjustmentView {
  code: string;
  name: string;
  ownerId: string;
  activeText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    activeText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.activeText = activeText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutAdjustmentView(item: PayoutAdjustment): PayoutAdjustmentView {
  return new PayoutAdjustmentView(
    item.code,
    item.name,
    item.ownerId,
    `${item.active}`,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutAdjustmentViews(items: PayoutAdjustment[]): PayoutAdjustmentView[] {
  const views: PayoutAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPayoutAdjustmentView(item));
  }
  return views;
}

export function sumPayoutAdjustmentView(view: PayoutAdjustmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
