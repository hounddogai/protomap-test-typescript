import * as text from "../../../../kit/text.js";
import { WarmupWindow } from "./warmup-window.js";

/** How screens and exports show a warmup window. */
export class WarmupWindowView {
  code: string;
  nameText: string;
  maximumText: string;
  audienceIdText: string;
  revision: string;
  source: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    maximumText: string,
    audienceIdText: string,
    revision: string,
    source: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.maximumText = maximumText;
    this.audienceIdText = audienceIdText;
    this.revision = revision;
    this.source = source;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupWindowView(item: WarmupWindow): WarmupWindowView {
  return new WarmupWindowView(
    text.truncate(item.code, 40),
    item.name,
    item.maximum.toFixed(2),
    item.audienceId,
    String(item.revision),
    item.source,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupWindowViews(items: WarmupWindow[]): WarmupWindowView[] {
  const views: WarmupWindowView[] = [];
  for (const item of items) {
    views.push(toWarmupWindowView(item));
  }
  return views;
}

export function sumWarmupWindowView(view: WarmupWindowView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedMaximum + parsedRevision + parsedUpdatedAt;
}
