import * as text from "../../../../kit/text.js";
import { BatchedProofQuota } from "./batched-proof-quota.js";

/** How screens and exports show a batched proof quota. */
export class BatchedProofQuotaView {
  code: string;
  label: string;
  version: string;
  windowDays: string;
  quantity: string;
  locale: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    windowDays: string,
    quantity: string,
    locale: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.locale = locale;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedProofQuotaView(item: BatchedProofQuota): BatchedProofQuotaView {
  return new BatchedProofQuotaView(
    item.code,
    item.label,
    String(item.version),
    String(item.windowDays),
    String(item.quantity),
    item.locale,
    text.truncate(item.campaignRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedProofQuotaViews(items: BatchedProofQuota[]): BatchedProofQuotaView[] {
  const views: BatchedProofQuotaView[] = [];
  for (const item of items) {
    views.push(toBatchedProofQuotaView(item));
  }
  return views;
}

export function sumBatchedProofQuotaView(view: BatchedProofQuotaView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedVersion + parsedWindowDays + parsedQuantity;
}
