import * as text from "../../../../kit/text.js";
import { SenderTier } from "./sender-tier.js";

/** How screens and exports show a sender tier. */
export class SenderTierView {
  code: string;
  label: string;
  updatedAt: string;
  openRateText: string;
  visibleText: string;
  maximum: string;
  audienceId: string;
  floorValue: string;
  checksumText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    openRateText: string,
    visibleText: string,
    maximum: string,
    audienceId: string,
    floorValue: string,
    checksumText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.openRateText = openRateText;
    this.visibleText = visibleText;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.checksumText = checksumText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toSenderTierView(item: SenderTier): SenderTierView {
  return new SenderTierView(
    text.truncate(item.code, 64),
    item.label,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    `${item.visible}`,
    item.maximum.toFixed(2),
    text.truncate(item.audienceId, 120),
    item.floorValue.toFixed(2),
    text.truncate(item.checksum, 80),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderTierViews(items: SenderTier[]): SenderTierView[] {
  const views: SenderTierView[] = [];
  for (const item of items) {
    views.push(toSenderTierView(item));
  }
  return views;
}

export function sumSenderTierView(view: SenderTierView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedUpdatedAt + parsedOpenRate + parsedMaximum;
}
