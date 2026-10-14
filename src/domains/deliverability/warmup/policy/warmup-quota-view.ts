import * as text from "../../../../kit/text.js";
import { WarmupQuota } from "./warmup-quota.js";

/** How screens and exports show a warmup quota. */
export class WarmupQuotaView {
  code: string;
  label: string;
  retriesText: string;
  approved: string;
  campaignRef: string;
  summaryText: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retriesText: string,
    approved: string,
    campaignRef: string,
    summaryText: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retriesText = retriesText;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.summaryText = summaryText;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupQuotaView(item: WarmupQuota): WarmupQuotaView {
  return new WarmupQuotaView(
    item.code,
    item.label,
    String(item.retries),
    `${item.approved}`,
    text.truncate(item.campaignRef, 40),
    item.summary,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupQuotaViews(items: WarmupQuota[]): WarmupQuotaView[] {
  const views: WarmupQuotaView[] = [];
  for (const item of items) {
    views.push(toWarmupQuotaView(item));
  }
  return views;
}

export function sumWarmupQuotaView(view: WarmupQuotaView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedRetries;
}
