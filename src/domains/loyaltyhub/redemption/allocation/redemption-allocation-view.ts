import { RedemptionAllocation } from "./redemption-allocation.js";

/** How screens and exports show a redemption allocation. */
export class RedemptionAllocationView {
  code: string;
  title: string;
  ratio: string;
  version: string;
  batchSize: string;
  limitText: string;
  category: string;
  priority: string;
  currency: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratio: string,
    version: string,
    batchSize: string,
    limitText: string,
    category: string,
    priority: string,
    currency: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.version = version;
    this.batchSize = batchSize;
    this.limitText = limitText;
    this.category = category;
    this.priority = priority;
    this.currency = currency;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionAllocationView(item: RedemptionAllocation): RedemptionAllocationView {
  return new RedemptionAllocationView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    String(item.version),
    String(item.batchSize),
    String(item.limit),
    item.category,
    String(item.priority),
    item.currency,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionAllocationViews(items: RedemptionAllocation[]): RedemptionAllocationView[] {
  const views: RedemptionAllocationView[] = [];
  for (const item of items) {
    views.push(toRedemptionAllocationView(item));
  }
  return views;
}

export function sumRedemptionAllocationView(view: RedemptionAllocationView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRatio + parsedVersion + parsedBatchSize;
}
