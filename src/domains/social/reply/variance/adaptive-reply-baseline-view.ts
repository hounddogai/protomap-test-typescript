import * as text from "../../../../kit/text.js";
import { AdaptiveReplyBaseline } from "./adaptive-reply-baseline.js";

/** How screens and exports show a adaptive reply baseline. */
export class AdaptiveReplyBaselineView {
  codeText: string;
  title: string;
  segment: string;
  graceDaysText: string;
  source: string;
  nameText: string;
  startsAt: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    graceDaysText: string,
    source: string,
    nameText: string,
    startsAt: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.graceDaysText = graceDaysText;
    this.source = source;
    this.nameText = nameText;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveReplyBaselineView(item: AdaptiveReplyBaseline): AdaptiveReplyBaselineView {
  return new AdaptiveReplyBaselineView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    item.segment,
    String(item.graceDays),
    item.source,
    item.name,
    String(item.startsAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveReplyBaselineViews(items: AdaptiveReplyBaseline[]): AdaptiveReplyBaselineView[] {
  const views: AdaptiveReplyBaselineView[] = [];
  for (const item of items) {
    views.push(toAdaptiveReplyBaselineView(item));
  }
  return views;
}

export function sumAdaptiveReplyBaselineView(view: AdaptiveReplyBaselineView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedGraceDays + parsedStartsAt + parsedQuantity;
}
