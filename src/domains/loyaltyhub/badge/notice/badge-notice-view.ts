import * as text from "../../../../kit/text.js";
import { BadgeNotice } from "./badge-notice.js";

/** How screens and exports show a badge notice. */
export class BadgeNoticeView {
  code: string;
  label: string;
  category: string;
  discount: string;
  journeyId: string;
  utmSource: string;
  openRate: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    discount: string,
    journeyId: string,
    utmSource: string,
    openRate: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.discount = discount;
    this.journeyId = journeyId;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeNoticeView(item: BadgeNotice): BadgeNoticeView {
  return new BadgeNoticeView(
    text.truncate(item.code, 80),
    item.label,
    item.category,
    item.discount.toFixed(2),
    item.journeyId,
    text.truncate(item.utmSource, 120),
    item.openRate.toFixed(2),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeNoticeViews(items: BadgeNotice[]): BadgeNoticeView[] {
  const views: BadgeNoticeView[] = [];
  for (const item of items) {
    views.push(toBadgeNoticeView(item));
  }
  return views;
}

export function sumBadgeNoticeView(view: BadgeNoticeView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDiscount + parsedOpenRate;
}
