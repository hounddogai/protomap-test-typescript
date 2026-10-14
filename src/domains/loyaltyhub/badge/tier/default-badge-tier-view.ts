import * as text from "../../../../kit/text.js";
import { DefaultBadgeTier } from "./default-badge-tier.js";

/** How screens and exports show a default badge tier. */
export class DefaultBadgeTierView {
  code: string;
  label: string;
  maximum: string;
  endsAt: string;
  threshold: string;
  channel: string;
  revisionText: string;
  phone: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximum: string,
    endsAt: string,
    threshold: string,
    channel: string,
    revisionText: string,
    phone: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.threshold = threshold;
    this.channel = channel;
    this.revisionText = revisionText;
    this.phone = phone;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBadgeTierView(item: DefaultBadgeTier): DefaultBadgeTierView {
  return new DefaultBadgeTierView(
    item.code,
    text.truncate(item.label, 120),
    item.maximum.toFixed(2),
    String(item.endsAt),
    item.threshold.toFixed(2),
    item.channel,
    String(item.revision),
    text.truncate(item.phone, 64),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBadgeTierViews(items: DefaultBadgeTier[]): DefaultBadgeTierView[] {
  const views: DefaultBadgeTierView[] = [];
  for (const item of items) {
    views.push(toDefaultBadgeTierView(item));
  }
  return views;
}

export function sumDefaultBadgeTierView(view: DefaultBadgeTierView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedMaximum + parsedEndsAt + parsedThreshold;
}
