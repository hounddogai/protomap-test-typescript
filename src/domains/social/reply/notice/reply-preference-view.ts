import * as text from "../../../../kit/text.js";
import { ReplyPreference } from "./reply-preference.js";

/** How screens and exports show a reply preference. */
export class ReplyPreferenceView {
  codeText: string;
  title: string;
  journeyId: string;
  quantity: string;
  campaignRef: string;
  locale: string;
  graceDays: string;
  contactEmailText: string;
  label: string;
  priority: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    journeyId: string,
    quantity: string,
    campaignRef: string,
    locale: string,
    graceDays: string,
    contactEmailText: string,
    label: string,
    priority: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.graceDays = graceDays;
    this.contactEmailText = contactEmailText;
    this.label = label;
    this.priority = priority;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toReplyPreferenceView(item: ReplyPreference): ReplyPreferenceView {
  return new ReplyPreferenceView(
    item.code,
    item.title,
    text.truncate(item.journeyId, 120),
    String(item.quantity),
    item.campaignRef,
    item.locale,
    String(item.graceDays),
    item.contactEmail,
    item.label,
    String(item.priority),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyPreferenceViews(items: ReplyPreference[]): ReplyPreferenceView[] {
  const views: ReplyPreferenceView[] = [];
  for (const item of items) {
    views.push(toReplyPreferenceView(item));
  }
  return views;
}

export function sumReplyPreferenceView(view: ReplyPreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedQuantity + parsedGraceDays + parsedPriority;
}
