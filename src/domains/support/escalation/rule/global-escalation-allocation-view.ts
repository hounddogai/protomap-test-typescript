import { GlobalEscalationAllocation } from "./global-escalation-allocation.js";

/** How screens and exports show a global escalation allocation. */
export class GlobalEscalationAllocationView {
  code: string;
  label: string;
  timezone: string;
  quantity: string;
  updatedAtText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    quantity: string,
    updatedAtText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.quantity = quantity;
    this.updatedAtText = updatedAtText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEscalationAllocationView(item: GlobalEscalationAllocation): GlobalEscalationAllocationView {
  return new GlobalEscalationAllocationView(
    item.code,
    item.label,
    item.timezone,
    String(item.quantity),
    String(item.updatedAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEscalationAllocationViews(items: GlobalEscalationAllocation[]): GlobalEscalationAllocationView[] {
  const views: GlobalEscalationAllocationView[] = [];
  for (const item of items) {
    views.push(toGlobalEscalationAllocationView(item));
  }
  return views;
}

export function sumGlobalEscalationAllocationView(view: GlobalEscalationAllocationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedQuantity + parsedUpdatedAt + parsedBid;
}
