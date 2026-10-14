import * as text from "../../../../kit/text.js";
import { CappedReplyQuota } from "./capped-reply-quota.js";

/** How screens and exports show a capped reply quota. */
export class CappedReplyQuotaView {
  code: string;
  labelText: string;
  ratio: string;
  ceiling: string;
  notes: string;
  source: string;
  ownerId: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ratio: string,
    ceiling: string,
    notes: string,
    source: string,
    ownerId: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.notes = notes;
    this.source = source;
    this.ownerId = ownerId;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toCappedReplyQuotaView(item: CappedReplyQuota): CappedReplyQuotaView {
  return new CappedReplyQuotaView(
    text.truncate(item.code, 40),
    item.label,
    item.ratio.toFixed(2),
    item.ceiling.toFixed(2),
    item.notes,
    item.source,
    text.truncate(item.ownerId, 120),
    text.truncate(item.category, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedReplyQuotaViews(items: CappedReplyQuota[]): CappedReplyQuotaView[] {
  const views: CappedReplyQuotaView[] = [];
  for (const item of items) {
    views.push(toCappedReplyQuotaView(item));
  }
  return views;
}

export function sumCappedReplyQuotaView(view: CappedReplyQuotaView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRatio + parsedCeiling;
}
