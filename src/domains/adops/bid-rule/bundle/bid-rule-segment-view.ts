import * as text from "../../../../kit/text.js";
import { BidRuleSegment } from "./bid-rule-segment.js";

/** How screens and exports show a bid rule segment. */
export class BidRuleSegmentView {
  codeText: string;
  label: string;
  createdAt: string;
  ownerId: string;
  phone: string;
  notesText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    createdAt: string,
    ownerId: string,
    phone: string,
    notesText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.phone = phone;
    this.notesText = notesText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleSegmentView(item: BidRuleSegment): BidRuleSegmentView {
  return new BidRuleSegmentView(
    text.truncate(item.code, 40),
    item.label,
    String(item.createdAt),
    item.ownerId,
    item.phone,
    text.truncate(item.notes, 64),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleSegmentViews(items: BidRuleSegment[]): BidRuleSegmentView[] {
  const views: BidRuleSegmentView[] = [];
  for (const item of items) {
    views.push(toBidRuleSegmentView(item));
  }
  return views;
}

export function sumBidRuleSegmentView(view: BidRuleSegmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCreatedAt + parsedCeiling;
}
