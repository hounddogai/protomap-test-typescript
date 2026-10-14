import * as text from "../../../../kit/text.js";
import { RetentionNotice } from "./retention-notice.js";

/** How screens and exports show a retention notice. */
export class RetentionNoticeView {
  code: string;
  nameText: string;
  cost: string;
  checksum: string;
  createdAt: string;
  rate: string;
  cohort: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    cost: string,
    checksum: string,
    createdAt: string,
    rate: string,
    cohort: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.cost = cost;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.rate = rate;
    this.cohort = cohort;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionNoticeView(item: RetentionNotice): RetentionNoticeView {
  return new RetentionNoticeView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.checksum,
    String(item.createdAt),
    item.rate.toFixed(2),
    text.truncate(item.cohort, 64),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionNoticeViews(items: RetentionNotice[]): RetentionNoticeView[] {
  const views: RetentionNoticeView[] = [];
  for (const item of items) {
    views.push(toRetentionNoticeView(item));
  }
  return views;
}

export function sumRetentionNoticeView(view: RetentionNoticeView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCost + parsedCreatedAt + parsedRate;
}
