import { TieredBounceAllocation } from "./tiered-bounce-allocation.js";

/** How screens and exports show a tiered bounce allocation. */
export class TieredBounceAllocationView {
  codeText: string;
  name: string;
  retries: string;
  reviewerText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    retries: string,
    reviewerText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.retries = retries;
    this.reviewerText = reviewerText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceAllocationView(item: TieredBounceAllocation): TieredBounceAllocationView {
  return new TieredBounceAllocationView(
    item.code,
    item.name,
    String(item.retries),
    item.reviewer,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceAllocationViews(items: TieredBounceAllocation[]): TieredBounceAllocationView[] {
  const views: TieredBounceAllocationView[] = [];
  for (const item of items) {
    views.push(toTieredBounceAllocationView(item));
  }
  return views;
}

export function sumTieredBounceAllocationView(view: TieredBounceAllocationView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
