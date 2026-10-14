import * as text from "../../../../kit/text.js";
import { WindowOverride } from "./window-override.js";

/** How screens and exports show a window override. */
export class WindowOverrideView {
  code: string;
  title: string;
  limit: string;
  sendAt: string;
  updatedAt: string;
  campaignRef: string;
  journeyId: string;
  ratio: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limit: string,
    sendAt: string,
    updatedAt: string,
    campaignRef: string,
    journeyId: string,
    ratio: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toWindowOverrideView(item: WindowOverride): WindowOverrideView {
  return new WindowOverrideView(
    item.code,
    item.title,
    String(item.limit),
    String(item.sendAt),
    String(item.updatedAt),
    item.campaignRef,
    text.truncate(item.journeyId, 40),
    item.ratio.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowOverrideViews(items: WindowOverride[]): WindowOverrideView[] {
  const views: WindowOverrideView[] = [];
  for (const item of items) {
    views.push(toWindowOverrideView(item));
  }
  return views;
}

export function sumWindowOverrideView(view: WindowOverrideView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedLimit + parsedSendAt + parsedUpdatedAt;
}
