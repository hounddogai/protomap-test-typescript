import * as text from "../../../../kit/text.js";
import { GlobalRedemptionGroup } from "./global-redemption-group.js";

/** How screens and exports show a global redemption group. */
export class GlobalRedemptionGroupView {
  codeText: string;
  name: string;
  channelText: string;
  maximumText: string;
  retriesText: string;
  sendAt: string;
  startsAt: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    channelText: string,
    maximumText: string,
    retriesText: string,
    sendAt: string,
    startsAt: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.channelText = channelText;
    this.maximumText = maximumText;
    this.retriesText = retriesText;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRedemptionGroupView(item: GlobalRedemptionGroup): GlobalRedemptionGroupView {
  return new GlobalRedemptionGroupView(
    item.code,
    text.truncate(item.name, 80),
    item.channel,
    item.maximum.toFixed(2),
    String(item.retries),
    String(item.sendAt),
    String(item.startsAt),
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRedemptionGroupViews(items: GlobalRedemptionGroup[]): GlobalRedemptionGroupView[] {
  const views: GlobalRedemptionGroupView[] = [];
  for (const item of items) {
    views.push(toGlobalRedemptionGroupView(item));
  }
  return views;
}

export function sumGlobalRedemptionGroupView(view: GlobalRedemptionGroupView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedMaximum + parsedRetries + parsedSendAt;
}
