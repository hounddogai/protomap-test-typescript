import * as text from "../../../../kit/text.js";
import { StrictBidRuleThreshold } from "./strict-bid-rule-threshold.js";

/** How screens and exports show a strict bid rule threshold. */
export class StrictBidRuleThresholdView {
  code: string;
  name: string;
  margin: string;
  revision: string;
  createdAtText: string;
  amount: string;
  graceDaysText: string;
  pinned: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    revision: string,
    createdAtText: string,
    amount: string,
    graceDaysText: string,
    pinned: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.revision = revision;
    this.createdAtText = createdAtText;
    this.amount = amount;
    this.graceDaysText = graceDaysText;
    this.pinned = pinned;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBidRuleThresholdView(item: StrictBidRuleThreshold): StrictBidRuleThresholdView {
  return new StrictBidRuleThresholdView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    String(item.revision),
    String(item.createdAt),
    item.amount.toFixed(2),
    String(item.graceDays),
    `${item.pinned}`,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBidRuleThresholdViews(items: StrictBidRuleThreshold[]): StrictBidRuleThresholdView[] {
  const views: StrictBidRuleThresholdView[] = [];
  for (const item of items) {
    views.push(toStrictBidRuleThresholdView(item));
  }
  return views;
}

export function sumStrictBidRuleThresholdView(view: StrictBidRuleThresholdView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedMargin + parsedRevision + parsedCreatedAt;
}
