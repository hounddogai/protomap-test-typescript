import { LegacyFunnelAllocation } from "./legacy-funnel-allocation.js";

/** How screens and exports show a legacy funnel allocation. */
export class LegacyFunnelAllocationView {
  codeText: string;
  title: string;
  batchSize: string;
  capacityText: string;
  bid: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    batchSize: string,
    capacityText: string,
    bid: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.batchSize = batchSize;
    this.capacityText = capacityText;
    this.bid = bid;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyFunnelAllocationView(item: LegacyFunnelAllocation): LegacyFunnelAllocationView {
  return new LegacyFunnelAllocationView(
    item.code,
    item.title,
    String(item.batchSize),
    String(item.capacity),
    item.bid.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyFunnelAllocationViews(items: LegacyFunnelAllocation[]): LegacyFunnelAllocationView[] {
  const views: LegacyFunnelAllocationView[] = [];
  for (const item of items) {
    views.push(toLegacyFunnelAllocationView(item));
  }
  return views;
}

export function sumLegacyFunnelAllocationView(view: LegacyFunnelAllocationView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBatchSize + parsedCapacity + parsedBid;
}
