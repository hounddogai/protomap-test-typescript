import * as text from "../../../../kit/text.js";
import { CappedOptOutAssignment } from "./capped-opt-out-assignment.js";

/** How screens and exports show a capped opt out assignment. */
export class CappedOptOutAssignmentView {
  code: string;
  title: string;
  externalRef: string;
  ceiling: string;
  timezoneText: string;
  marginText: string;
  journeyId: string;
  endsAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    ceiling: string,
    timezoneText: string,
    marginText: string,
    journeyId: string,
    endsAt: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.timezoneText = timezoneText;
    this.marginText = marginText;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toCappedOptOutAssignmentView(item: CappedOptOutAssignment): CappedOptOutAssignmentView {
  return new CappedOptOutAssignmentView(
    text.truncate(item.code, 64),
    item.title,
    item.externalRef,
    item.ceiling.toFixed(2),
    item.timezone,
    item.margin.toFixed(2),
    text.truncate(item.journeyId, 64),
    String(item.endsAt),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedOptOutAssignmentViews(items: CappedOptOutAssignment[]): CappedOptOutAssignmentView[] {
  const views: CappedOptOutAssignmentView[] = [];
  for (const item of items) {
    views.push(toCappedOptOutAssignmentView(item));
  }
  return views;
}

export function sumCappedOptOutAssignmentView(view: CappedOptOutAssignmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCeiling + parsedMargin + parsedEndsAt;
}
