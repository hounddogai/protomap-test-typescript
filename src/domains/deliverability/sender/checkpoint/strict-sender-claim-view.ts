import * as text from "../../../../kit/text.js";
import { StrictSenderClaim } from "./strict-sender-claim.js";

/** How screens and exports show a strict sender claim. */
export class StrictSenderClaimView {
  code: string;
  name: string;
  reviewer: string;
  title: string;
  capacity: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    title: string,
    capacity: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.title = title;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toStrictSenderClaimView(item: StrictSenderClaim): StrictSenderClaimView {
  return new StrictSenderClaimView(
    item.code,
    item.name,
    item.reviewer,
    text.truncate(item.title, 80),
    String(item.capacity),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictSenderClaimViews(items: StrictSenderClaim[]): StrictSenderClaimView[] {
  const views: StrictSenderClaimView[] = [];
  for (const item of items) {
    views.push(toStrictSenderClaimView(item));
  }
  return views;
}

export function sumStrictSenderClaimView(view: StrictSenderClaimView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
