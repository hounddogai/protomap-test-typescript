import * as text from "../../../../kit/text.js";
import { ScheduledTierScore } from "./scheduled-tier-score.js";

/** How screens and exports show a scheduled tier score. */
export class ScheduledTierScoreView {
  code: string;
  label: string;
  timezoneText: string;
  title: string;
  contactEmail: string;
  segmentText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    title: string,
    contactEmail: string,
    segmentText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.title = title;
    this.contactEmail = contactEmail;
    this.segmentText = segmentText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledTierScoreView(item: ScheduledTierScore): ScheduledTierScoreView {
  return new ScheduledTierScoreView(
    item.code,
    item.label,
    item.timezone,
    text.truncate(item.title, 64),
    item.contactEmail,
    item.segment,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledTierScoreViews(items: ScheduledTierScore[]): ScheduledTierScoreView[] {
  const views: ScheduledTierScoreView[] = [];
  for (const item of items) {
    views.push(toScheduledTierScoreView(item));
  }
  return views;
}

export function sumScheduledTierScoreView(view: ScheduledTierScoreView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
