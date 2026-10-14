import { BatchedFunnelThreshold } from "./batched-funnel-threshold.js";

/** How screens and exports show a batched funnel threshold. */
export class BatchedFunnelThresholdView {
  code: string;
  label: string;
  rate: string;
  approvedText: string;
  description: string;
  costText: string;
  createdAtText: string;
  clicksText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    approvedText: string,
    description: string,
    costText: string,
    createdAtText: string,
    clicksText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.approvedText = approvedText;
    this.description = description;
    this.costText = costText;
    this.createdAtText = createdAtText;
    this.clicksText = clicksText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFunnelThresholdView(item: BatchedFunnelThreshold): BatchedFunnelThresholdView {
  return new BatchedFunnelThresholdView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    `${item.approved}`,
    item.description,
    item.cost.toFixed(2),
    String(item.createdAt),
    String(item.clicks),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFunnelThresholdViews(items: BatchedFunnelThreshold[]): BatchedFunnelThresholdView[] {
  const views: BatchedFunnelThresholdView[] = [];
  for (const item of items) {
    views.push(toBatchedFunnelThresholdView(item));
  }
  return views;
}

export function sumBatchedFunnelThresholdView(view: BatchedFunnelThresholdView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedRate + parsedCost + parsedCreatedAt;
}
