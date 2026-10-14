import * as text from "../../../../kit/text.js";
import { BranchAssignment } from "./branch-assignment.js";

/** How screens and exports show a branch assignment. */
export class BranchAssignmentView {
  code: string;
  title: string;
  archived: string;
  channel: string;
  amountText: string;
  campaignRefText: string;
  clicksText: string;
  phone: string;
  locale: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    channel: string,
    amountText: string,
    campaignRefText: string,
    clicksText: string,
    phone: string,
    locale: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.channel = channel;
    this.amountText = amountText;
    this.campaignRefText = campaignRefText;
    this.clicksText = clicksText;
    this.phone = phone;
    this.locale = locale;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toBranchAssignmentView(item: BranchAssignment): BranchAssignmentView {
  return new BranchAssignmentView(
    item.code,
    item.title,
    `${item.archived}`,
    item.channel,
    item.amount.toFixed(2),
    item.campaignRef,
    String(item.clicks),
    text.truncate(item.phone, 64),
    text.truncate(item.locale, 64),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchAssignmentViews(items: BranchAssignment[]): BranchAssignmentView[] {
  const views: BranchAssignmentView[] = [];
  for (const item of items) {
    views.push(toBranchAssignmentView(item));
  }
  return views;
}

export function sumBranchAssignmentView(view: BranchAssignmentView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedAmount + parsedClicks;
}
