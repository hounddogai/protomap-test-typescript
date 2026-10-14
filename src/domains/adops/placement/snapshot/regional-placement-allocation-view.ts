import * as text from "../../../../kit/text.js";
import { RegionalPlacementAllocation } from "./regional-placement-allocation.js";

/** How screens and exports show a regional placement allocation. */
export class RegionalPlacementAllocationView {
  codeText: string;
  title: string;
  visible: string;
  approvedText: string;
  endsAt: string;
  currency: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    visible: string,
    approvedText: string,
    endsAt: string,
    currency: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.visible = visible;
    this.approvedText = approvedText;
    this.endsAt = endsAt;
    this.currency = currency;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPlacementAllocationView(item: RegionalPlacementAllocation): RegionalPlacementAllocationView {
  return new RegionalPlacementAllocationView(
    item.code,
    text.truncate(item.title, 80),
    `${item.visible}`,
    `${item.approved}`,
    String(item.endsAt),
    item.currency,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPlacementAllocationViews(items: RegionalPlacementAllocation[]): RegionalPlacementAllocationView[] {
  const views: RegionalPlacementAllocationView[] = [];
  for (const item of items) {
    views.push(toRegionalPlacementAllocationView(item));
  }
  return views;
}

export function sumRegionalPlacementAllocationView(view: RegionalPlacementAllocationView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedEndsAt + parsedPriority;
}
