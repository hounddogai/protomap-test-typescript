import * as text from "../../../../kit/text.js";
import { PostGroup } from "./post-group.js";

/** How screens and exports show a post group. */
export class PostGroupView {
  code: string;
  title: string;
  minimumText: string;
  channel: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimumText: string,
    channel: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimumText = minimumText;
    this.channel = channel;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toPostGroupView(item: PostGroup): PostGroupView {
  return new PostGroupView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    item.minimum.toFixed(2),
    item.channel,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostGroupViews(items: PostGroup[]): PostGroupView[] {
  const views: PostGroupView[] = [];
  for (const item of items) {
    views.push(toPostGroupView(item));
  }
  return views;
}

export function sumPostGroupView(view: PostGroupView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMinimum;
}
