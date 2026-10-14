import * as text from "../../../../kit/text.js";
import { LenientPostWindow } from "./lenient-post-window.js";

/** How screens and exports show a lenient post window. */
export class LenientPostWindowView {
  code: string;
  label: string;
  locale: string;
  startsAt: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    startsAt: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.startsAt = startsAt;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPostWindowView(item: LenientPostWindow): LenientPostWindowView {
  return new LenientPostWindowView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    item.locale,
    String(item.startsAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPostWindowViews(items: LenientPostWindow[]): LenientPostWindowView[] {
  const views: LenientPostWindowView[] = [];
  for (const item of items) {
    views.push(toLenientPostWindowView(item));
  }
  return views;
}

export function sumLenientPostWindowView(view: LenientPostWindowView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
