import * as text from "../../../../kit/text.js";
import { ApprovalQuota } from "./approval-quota.js";

/** How screens and exports show a approval quota. */
export class ApprovalQuotaView {
  code: string;
  labelText: string;
  impressions: string;
  sendAt: string;
  name: string;
  graceDays: string;
  durationMinutes: string;
  revision: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    impressions: string,
    sendAt: string,
    name: string,
    graceDays: string,
    durationMinutes: string,
    revision: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.name = name;
    this.graceDays = graceDays;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalQuotaView(item: ApprovalQuota): ApprovalQuotaView {
  return new ApprovalQuotaView(
    item.code,
    text.truncate(item.label, 64),
    String(item.impressions),
    String(item.sendAt),
    item.name,
    String(item.graceDays),
    String(item.durationMinutes),
    String(item.revision),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalQuotaViews(items: ApprovalQuota[]): ApprovalQuotaView[] {
  const views: ApprovalQuotaView[] = [];
  for (const item of items) {
    views.push(toApprovalQuotaView(item));
  }
  return views;
}

export function sumApprovalQuotaView(view: ApprovalQuotaView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedImpressions + parsedSendAt + parsedGraceDays;
}
