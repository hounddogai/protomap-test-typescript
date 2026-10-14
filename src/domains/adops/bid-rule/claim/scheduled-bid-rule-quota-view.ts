import { ScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

/** How screens and exports show a scheduled bid rule quota. */
export class ScheduledBidRuleQuotaView {
  codeText: string;
  nameText: string;
  frequencyCap: string;
  createdAt: string;
  windowDays: string;
  checksum: string;
  retries: string;
  batchSize: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    frequencyCap: string,
    createdAt: string,
    windowDays: string,
    checksum: string,
    retries: string,
    batchSize: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.retries = retries;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBidRuleQuotaView(item: ScheduledBidRuleQuota): ScheduledBidRuleQuotaView {
  return new ScheduledBidRuleQuotaView(
    item.code,
    item.name,
    String(item.frequencyCap),
    String(item.createdAt),
    String(item.windowDays),
    item.checksum,
    String(item.retries),
    String(item.batchSize),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBidRuleQuotaViews(items: ScheduledBidRuleQuota[]): ScheduledBidRuleQuotaView[] {
  const views: ScheduledBidRuleQuotaView[] = [];
  for (const item of items) {
    views.push(toScheduledBidRuleQuotaView(item));
  }
  return views;
}

export function sumScheduledBidRuleQuotaView(view: ScheduledBidRuleQuotaView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedFrequencyCap + parsedCreatedAt + parsedWindowDays;
}
