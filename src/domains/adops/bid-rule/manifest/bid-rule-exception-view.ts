import * as text from "../../../../kit/text.js";
import { BidRuleException } from "./bid-rule-exception.js";

/** How screens and exports show a bid rule exception. */
export class BidRuleExceptionView {
  code: string;
  label: string;
  frequencyCap: string;
  approvedText: string;
  reviewerText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    approvedText: string,
    reviewerText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.approvedText = approvedText;
    this.reviewerText = reviewerText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleExceptionView(item: BidRuleException): BidRuleExceptionView {
  return new BidRuleExceptionView(
    text.truncate(item.code, 120),
    item.label,
    String(item.frequencyCap),
    `${item.approved}`,
    text.truncate(item.reviewer, 120),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleExceptionViews(items: BidRuleException[]): BidRuleExceptionView[] {
  const views: BidRuleExceptionView[] = [];
  for (const item of items) {
    views.push(toBidRuleExceptionView(item));
  }
  return views;
}

export function sumBidRuleExceptionView(view: BidRuleExceptionView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
