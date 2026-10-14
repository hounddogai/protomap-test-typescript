import * as text from "../../../../kit/text.js";
import { ManualProofQuota } from "./manual-proof-quota.js";

/** How screens and exports show a manual proof quota. */
export class ManualProofQuotaView {
  code: string;
  label: string;
  clicksText: string;
  margin: string;
  floorValueText: string;
  discount: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    margin: string,
    floorValueText: string,
    discount: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.margin = margin;
    this.floorValueText = floorValueText;
    this.discount = discount;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toManualProofQuotaView(item: ManualProofQuota): ManualProofQuotaView {
  return new ManualProofQuotaView(
    text.truncate(item.code, 40),
    item.label,
    String(item.clicks),
    item.margin.toFixed(2),
    item.floorValue.toFixed(2),
    item.discount.toFixed(2),
    text.truncate(item.channel, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualProofQuotaViews(items: ManualProofQuota[]): ManualProofQuotaView[] {
  const views: ManualProofQuotaView[] = [];
  for (const item of items) {
    views.push(toManualProofQuotaView(item));
  }
  return views;
}

export function sumManualProofQuotaView(view: ManualProofQuotaView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedClicks + parsedMargin + parsedFloorValue;
}
