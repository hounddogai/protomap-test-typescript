import * as text from "../../../../kit/text.js";
import { PostRequest } from "./post-request.js";

/** How screens and exports show a post request. */
export class PostRequestView {
  code: string;
  title: string;
  maximum: string;
  countryText: string;
  notes: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximum: string,
    countryText: string,
    notes: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.countryText = countryText;
    this.notes = notes;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPostRequestView(item: PostRequest): PostRequestView {
  return new PostRequestView(
    text.truncate(item.code, 120),
    item.title,
    item.maximum.toFixed(2),
    item.country,
    text.truncate(item.notes, 40),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostRequestViews(items: PostRequest[]): PostRequestView[] {
  const views: PostRequestView[] = [];
  for (const item of items) {
    views.push(toPostRequestView(item));
  }
  return views;
}

export function sumPostRequestView(view: PostRequestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMaximum;
}
