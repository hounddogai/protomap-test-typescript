import * as text from "../../../../kit/text.js";
import { ReputationAssignment } from "./reputation-assignment.js";

/** How screens and exports show a reputation assignment. */
export class ReputationAssignmentView {
  code: string;
  titleText: string;
  locale: string;
  currency: string;
  bid: string;
  timezone: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    locale: string,
    currency: string,
    bid: string,
    timezone: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.locale = locale;
    this.currency = currency;
    this.bid = bid;
    this.timezone = timezone;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationAssignmentView(item: ReputationAssignment): ReputationAssignmentView {
  return new ReputationAssignmentView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 120),
    item.locale,
    text.truncate(item.currency, 80),
    item.bid.toFixed(2),
    text.truncate(item.timezone, 64),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationAssignmentViews(items: ReputationAssignment[]): ReputationAssignmentView[] {
  const views: ReputationAssignmentView[] = [];
  for (const item of items) {
    views.push(toReputationAssignmentView(item));
  }
  return views;
}

export function sumReputationAssignmentView(view: ReputationAssignmentView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
