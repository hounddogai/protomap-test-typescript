import * as text from "../../../../kit/text.js";
import { CappedTierRecord } from "./capped-tier-record.js";

/** How screens and exports show a capped tier record. */
export class CappedTierRecordView {
  code: string;
  label: string;
  categoryText: string;
  updatedAt: string;
  nameText: string;
  regionText: string;
  clicks: string;
  sendAt: string;
  bid: string;
  discount: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    categoryText: string,
    updatedAt: string,
    nameText: string,
    regionText: string,
    clicks: string,
    sendAt: string,
    bid: string,
    discount: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.categoryText = categoryText;
    this.updatedAt = updatedAt;
    this.nameText = nameText;
    this.regionText = regionText;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.bid = bid;
    this.discount = discount;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toCappedTierRecordView(item: CappedTierRecord): CappedTierRecordView {
  return new CappedTierRecordView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    item.category,
    String(item.updatedAt),
    text.truncate(item.name, 80),
    item.region,
    String(item.clicks),
    String(item.sendAt),
    item.bid.toFixed(2),
    item.discount.toFixed(2),
    text.truncate(item.segment, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedTierRecordViews(items: CappedTierRecord[]): CappedTierRecordView[] {
  const views: CappedTierRecordView[] = [];
  for (const item of items) {
    views.push(toCappedTierRecordView(item));
  }
  return views;
}

export function sumCappedTierRecordView(view: CappedTierRecordView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedUpdatedAt + parsedClicks + parsedSendAt;
}
