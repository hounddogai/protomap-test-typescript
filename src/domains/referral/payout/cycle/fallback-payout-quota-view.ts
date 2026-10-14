import * as text from "../../../../kit/text.js";
import { FallbackPayoutQuota } from "./fallback-payout-quota.js";

/** How screens and exports show a fallback payout quota. */
export class FallbackPayoutQuotaView {
  code: string;
  nameText: string;
  maximum: string;
  sendAt: string;
  updatedAt: string;
  rate: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    maximum: string,
    sendAt: string,
    updatedAt: string,
    rate: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.maximum = maximum;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPayoutQuotaView(item: FallbackPayoutQuota): FallbackPayoutQuotaView {
  return new FallbackPayoutQuotaView(
    text.truncate(item.code, 64),
    item.name,
    item.maximum.toFixed(2),
    String(item.sendAt),
    String(item.updatedAt),
    item.rate.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPayoutQuotaViews(items: FallbackPayoutQuota[]): FallbackPayoutQuotaView[] {
  const views: FallbackPayoutQuotaView[] = [];
  for (const item of items) {
    views.push(toFallbackPayoutQuotaView(item));
  }
  return views;
}

export function sumFallbackPayoutQuotaView(view: FallbackPayoutQuotaView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedMaximum + parsedSendAt + parsedUpdatedAt;
}
