import * as text from "../../../../kit/text.js";
import { BounceNotice } from "./bounce-notice.js";

/** How screens and exports show a bounce notice. */
export class BounceNoticeView {
  code: string;
  label: string;
  rate: string;
  channel: string;
  minimumText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    channel: string,
    minimumText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.channel = channel;
    this.minimumText = minimumText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toBounceNoticeView(item: BounceNotice): BounceNoticeView {
  return new BounceNoticeView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    text.truncate(item.channel, 120),
    item.minimum.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceNoticeViews(items: BounceNotice[]): BounceNoticeView[] {
  const views: BounceNoticeView[] = [];
  for (const item of items) {
    views.push(toBounceNoticeView(item));
  }
  return views;
}

export function sumBounceNoticeView(view: BounceNoticeView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedRate + parsedMinimum;
}
