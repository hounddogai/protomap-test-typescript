import * as text from "../../../../kit/text.js";
import { StrictReplyProposal } from "./strict-reply-proposal.js";

/** How screens and exports show a strict reply proposal. */
export class StrictReplyProposalView {
  code: string;
  title: string;
  windowDaysText: string;
  segment: string;
  sequence: string;
  unit: string;
  limitText: string;
  sendAt: string;
  conversionRate: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDaysText: string,
    segment: string,
    sequence: string,
    unit: string,
    limitText: string,
    sendAt: string,
    conversionRate: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDaysText = windowDaysText;
    this.segment = segment;
    this.sequence = sequence;
    this.unit = unit;
    this.limitText = limitText;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toStrictReplyProposalView(item: StrictReplyProposal): StrictReplyProposalView {
  return new StrictReplyProposalView(
    text.truncate(item.code, 64),
    item.title,
    String(item.windowDays),
    item.segment,
    String(item.sequence),
    item.unit,
    String(item.limit),
    String(item.sendAt),
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictReplyProposalViews(items: StrictReplyProposal[]): StrictReplyProposalView[] {
  const views: StrictReplyProposalView[] = [];
  for (const item of items) {
    views.push(toStrictReplyProposalView(item));
  }
  return views;
}

export function sumStrictReplyProposalView(view: StrictReplyProposalView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedWindowDays + parsedSequence + parsedLimit;
}
