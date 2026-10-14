import * as text from "../../../../kit/text.js";
import { AdaptiveCreditNotice } from "./adaptive-credit-notice.js";

/** How screens and exports show a adaptive credit notice. */
export class AdaptiveCreditNoticeView {
  codeText: string;
  titleText: string;
  discount: string;
  externalRefText: string;
  checksum: string;
  source: string;
  phone: string;
  summary: string;
  rate: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    discount: string,
    externalRefText: string,
    checksum: string,
    source: string,
    phone: string,
    summary: string,
    rate: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.discount = discount;
    this.externalRefText = externalRefText;
    this.checksum = checksum;
    this.source = source;
    this.phone = phone;
    this.summary = summary;
    this.rate = rate;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreditNoticeView(item: AdaptiveCreditNotice): AdaptiveCreditNoticeView {
  return new AdaptiveCreditNoticeView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    item.externalRef,
    text.truncate(item.checksum, 64),
    item.source,
    text.truncate(item.phone, 80),
    item.summary,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreditNoticeViews(items: AdaptiveCreditNotice[]): AdaptiveCreditNoticeView[] {
  const views: AdaptiveCreditNoticeView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreditNoticeView(item));
  }
  return views;
}

export function sumAdaptiveCreditNoticeView(view: AdaptiveCreditNoticeView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDiscount + parsedRate + parsedBudget;
}
