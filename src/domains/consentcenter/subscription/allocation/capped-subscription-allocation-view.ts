import { CappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

/** How screens and exports show a capped subscription allocation. */
export class CappedSubscriptionAllocationView {
  code: string;
  name: string;
  updatedAt: string;
  openRateText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    openRateText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRateText = openRateText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSubscriptionAllocationView(item: CappedSubscriptionAllocation): CappedSubscriptionAllocationView {
  return new CappedSubscriptionAllocationView(
    item.code,
    item.name,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSubscriptionAllocationViews(items: CappedSubscriptionAllocation[]): CappedSubscriptionAllocationView[] {
  const views: CappedSubscriptionAllocationView[] = [];
  for (const item of items) {
    views.push(toCappedSubscriptionAllocationView(item));
  }
  return views;
}

export function sumCappedSubscriptionAllocationView(view: CappedSubscriptionAllocationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedUpdatedAt + parsedOpenRate + parsedPriority;
}
