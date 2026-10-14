import * as text from "../../../../kit/text.js";
import { TieredSenderTarget } from "./tiered-sender-target.js";

/** How screens and exports show a tiered sender target. */
export class TieredSenderTargetView {
  code: string;
  name: string;
  ownerId: string;
  source: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    source: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.source = source;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSenderTargetView(item: TieredSenderTarget): TieredSenderTargetView {
  return new TieredSenderTargetView(
    text.truncate(item.code, 40),
    item.name,
    item.ownerId,
    text.truncate(item.source, 120),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSenderTargetViews(items: TieredSenderTarget[]): TieredSenderTargetView[] {
  const views: TieredSenderTargetView[] = [];
  for (const item of items) {
    views.push(toTieredSenderTargetView(item));
  }
  return views;
}

export function sumTieredSenderTargetView(view: TieredSenderTargetView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedSendAt;
}
