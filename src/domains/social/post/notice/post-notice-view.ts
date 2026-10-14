import * as text from "../../../../kit/text.js";
import { PostNotice } from "./post-notice.js";

/** How screens and exports show a post notice. */
export class PostNoticeView {
  codeText: string;
  title: string;
  limit: string;
  quantity: string;
  endsAt: string;
  region: string;
  description: string;
  locale: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    limit: string,
    quantity: string,
    endsAt: string,
    region: string,
    description: string,
    locale: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.limit = limit;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.region = region;
    this.description = description;
    this.locale = locale;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toPostNoticeView(item: PostNotice): PostNoticeView {
  return new PostNoticeView(
    item.code,
    item.title,
    String(item.limit),
    String(item.quantity),
    String(item.endsAt),
    item.region,
    item.description,
    text.truncate(item.locale, 64),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostNoticeViews(items: PostNotice[]): PostNoticeView[] {
  const views: PostNoticeView[] = [];
  for (const item of items) {
    views.push(toPostNoticeView(item));
  }
  return views;
}

export function sumPostNoticeView(view: PostNoticeView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedLimit + parsedQuantity + parsedEndsAt;
}
