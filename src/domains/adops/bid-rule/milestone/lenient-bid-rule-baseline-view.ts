import * as text from "../../../../kit/text.js";
import { LenientBidRuleBaseline } from "./lenient-bid-rule-baseline.js";

/** How screens and exports show a lenient bid rule baseline. */
export class LenientBidRuleBaselineView {
  code: string;
  title: string;
  startsAt: string;
  visible: string;
  contactEmail: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    visible: string,
    contactEmail: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBidRuleBaselineView(item: LenientBidRuleBaseline): LenientBidRuleBaselineView {
  return new LenientBidRuleBaselineView(
    text.truncate(item.code, 80),
    item.title,
    String(item.startsAt),
    `${item.visible}`,
    text.truncate(item.contactEmail, 64),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBidRuleBaselineViews(items: LenientBidRuleBaseline[]): LenientBidRuleBaselineView[] {
  const views: LenientBidRuleBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientBidRuleBaselineView(item));
  }
  return views;
}

export function sumLenientBidRuleBaselineView(view: LenientBidRuleBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
