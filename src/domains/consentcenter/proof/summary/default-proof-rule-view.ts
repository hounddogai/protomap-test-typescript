import * as text from "../../../../kit/text.js";
import { DefaultProofRule } from "./default-proof-rule.js";

/** How screens and exports show a default proof rule. */
export class DefaultProofRuleView {
  code: string;
  title: string;
  frequencyCap: string;
  summaryText: string;
  segment: string;
  phone: string;
  variant: string;
  bid: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCap: string,
    summaryText: string,
    segment: string,
    phone: string,
    variant: string,
    bid: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.summaryText = summaryText;
    this.segment = segment;
    this.phone = phone;
    this.variant = variant;
    this.bid = bid;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultProofRuleView(item: DefaultProofRule): DefaultProofRuleView {
  return new DefaultProofRuleView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.summary,
    text.truncate(item.segment, 64),
    text.truncate(item.phone, 40),
    item.variant,
    item.bid.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultProofRuleViews(items: DefaultProofRule[]): DefaultProofRuleView[] {
  const views: DefaultProofRuleView[] = [];
  for (const item of items) {
    views.push(toDefaultProofRuleView(item));
  }
  return views;
}

export function sumDefaultProofRuleView(view: DefaultProofRuleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedFrequencyCap + parsedBid + parsedEndsAt;
}
