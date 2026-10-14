import * as text from "../../../../kit/text.js";
import { FallbackBounceQuota } from "./fallback-bounce-quota.js";

/** How screens and exports show a fallback bounce quota. */
export class FallbackBounceQuotaView {
  code: string;
  title: string;
  graceDaysText: string;
  ownerId: string;
  floorValue: string;
  marginText: string;
  maximum: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDaysText: string,
    ownerId: string,
    floorValue: string,
    marginText: string,
    maximum: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDaysText = graceDaysText;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.marginText = marginText;
    this.maximum = maximum;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBounceQuotaView(item: FallbackBounceQuota): FallbackBounceQuotaView {
  return new FallbackBounceQuotaView(
    item.code,
    item.title,
    String(item.graceDays),
    text.truncate(item.ownerId, 64),
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    item.maximum.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBounceQuotaViews(items: FallbackBounceQuota[]): FallbackBounceQuotaView[] {
  const views: FallbackBounceQuotaView[] = [];
  for (const item of items) {
    views.push(toFallbackBounceQuotaView(item));
  }
  return views;
}

export function sumFallbackBounceQuotaView(view: FallbackBounceQuotaView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedGraceDays + parsedFloorValue + parsedMargin;
}
