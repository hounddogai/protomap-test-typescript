import * as text from "../../../../kit/text.js";
import { ScheduledSenderClaim } from "./scheduled-sender-claim.js";

/** How screens and exports show a scheduled sender claim. */
export class ScheduledSenderClaimView {
  code: string;
  titleText: string;
  retries: string;
  region: string;
  priorityText: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    retries: string,
    region: string,
    priorityText: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.retries = retries;
    this.region = region;
    this.priorityText = priorityText;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSenderClaimView(item: ScheduledSenderClaim): ScheduledSenderClaimView {
  return new ScheduledSenderClaimView(
    text.truncate(item.code, 64),
    item.title,
    String(item.retries),
    item.region,
    String(item.priority),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSenderClaimViews(items: ScheduledSenderClaim[]): ScheduledSenderClaimView[] {
  const views: ScheduledSenderClaimView[] = [];
  for (const item of items) {
    views.push(toScheduledSenderClaimView(item));
  }
  return views;
}

export function sumScheduledSenderClaimView(view: ScheduledSenderClaimView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedRetries + parsedPriority;
}
