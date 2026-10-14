import * as text from "../../../../kit/text.js";
import { ComplaintProposal } from "./complaint-proposal.js";

/** How screens and exports show a complaint proposal. */
export class ComplaintProposalView {
  code: string;
  name: string;
  marginText: string;
  locale: string;
  timezone: string;
  ownerId: string;
  maximum: string;
  windowDays: string;
  channel: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    marginText: string,
    locale: string,
    timezone: string,
    ownerId: string,
    maximum: string,
    windowDays: string,
    channel: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.marginText = marginText;
    this.locale = locale;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.channel = channel;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintProposalView(item: ComplaintProposal): ComplaintProposalView {
  return new ComplaintProposalView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    text.truncate(item.locale, 40),
    text.truncate(item.timezone, 64),
    text.truncate(item.ownerId, 80),
    item.maximum.toFixed(2),
    String(item.windowDays),
    item.channel,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintProposalViews(items: ComplaintProposal[]): ComplaintProposalView[] {
  const views: ComplaintProposalView[] = [];
  for (const item of items) {
    views.push(toComplaintProposalView(item));
  }
  return views;
}

export function sumComplaintProposalView(view: ComplaintProposalView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedMargin + parsedMaximum + parsedWindowDays;
}
