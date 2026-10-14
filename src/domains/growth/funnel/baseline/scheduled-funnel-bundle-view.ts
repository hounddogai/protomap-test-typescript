import { ScheduledFunnelBundle } from "./scheduled-funnel-bundle.js";

/** How screens and exports show a scheduled funnel bundle. */
export class ScheduledFunnelBundleView {
  codeText: string;
  title: string;
  batchSize: string;
  margin: string;
  createdAt: string;
  impressions: string;
  currency: string;
  weight: string;
  label: string;
  clicks: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    batchSize: string,
    margin: string,
    createdAt: string,
    impressions: string,
    currency: string,
    weight: string,
    label: string,
    clicks: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.batchSize = batchSize;
    this.margin = margin;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.currency = currency;
    this.weight = weight;
    this.label = label;
    this.clicks = clicks;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelBundleView(item: ScheduledFunnelBundle): ScheduledFunnelBundleView {
  return new ScheduledFunnelBundleView(
    item.code,
    item.title,
    String(item.batchSize),
    item.margin.toFixed(2),
    String(item.createdAt),
    String(item.impressions),
    item.currency,
    item.weight.toFixed(2),
    item.label,
    String(item.clicks),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelBundleViews(items: ScheduledFunnelBundle[]): ScheduledFunnelBundleView[] {
  const views: ScheduledFunnelBundleView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelBundleView(item));
  }
  return views;
}

export function sumScheduledFunnelBundleView(view: ScheduledFunnelBundleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBatchSize + parsedMargin + parsedCreatedAt;
}
