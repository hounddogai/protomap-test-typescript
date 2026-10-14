import * as text from "../../../../kit/text.js";
import { CappedOptOutDigest } from "./capped-opt-out-digest.js";

/** How screens and exports show a capped opt out digest. */
export class CappedOptOutDigestView {
  codeText: string;
  titleText: string;
  phone: string;
  region: string;
  visible: string;
  margin: string;
  audienceId: string;
  priority: string;
  channel: string;
  utmSourceText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    phone: string,
    region: string,
    visible: string,
    margin: string,
    audienceId: string,
    priority: string,
    channel: string,
    utmSourceText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.phone = phone;
    this.region = region;
    this.visible = visible;
    this.margin = margin;
    this.audienceId = audienceId;
    this.priority = priority;
    this.channel = channel;
    this.utmSourceText = utmSourceText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toCappedOptOutDigestView(item: CappedOptOutDigest): CappedOptOutDigestView {
  return new CappedOptOutDigestView(
    text.truncate(item.code, 120),
    item.title,
    item.phone,
    item.region,
    `${item.visible}`,
    item.margin.toFixed(2),
    item.audienceId,
    String(item.priority),
    item.channel,
    item.utmSource,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedOptOutDigestViews(items: CappedOptOutDigest[]): CappedOptOutDigestView[] {
  const views: CappedOptOutDigestView[] = [];
  for (const item of items) {
    views.push(toCappedOptOutDigestView(item));
  }
  return views;
}

export function sumCappedOptOutDigestView(view: CappedOptOutDigestView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMargin + parsedPriority + parsedQuantity;
}
