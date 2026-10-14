import * as text from "../../../../kit/text.js";
import { ManualRetentionQuota } from "./manual-retention-quota.js";

/** How screens and exports show a manual retention quota. */
export class ManualRetentionQuotaView {
  code: string;
  title: string;
  batchSizeText: string;
  ownerIdText: string;
  channel: string;
  currency: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSizeText: string,
    ownerIdText: string,
    channel: string,
    currency: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSizeText = batchSizeText;
    this.ownerIdText = ownerIdText;
    this.channel = channel;
    this.currency = currency;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toManualRetentionQuotaView(item: ManualRetentionQuota): ManualRetentionQuotaView {
  return new ManualRetentionQuotaView(
    item.code,
    item.title,
    String(item.batchSize),
    item.ownerId,
    text.truncate(item.channel, 120),
    item.currency,
    text.truncate(item.source, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRetentionQuotaViews(items: ManualRetentionQuota[]): ManualRetentionQuotaView[] {
  const views: ManualRetentionQuotaView[] = [];
  for (const item of items) {
    views.push(toManualRetentionQuotaView(item));
  }
  return views;
}

export function sumManualRetentionQuotaView(view: ManualRetentionQuotaView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBatchSize;
}
