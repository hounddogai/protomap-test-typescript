import * as text from "../../../../kit/text.js";
import { StrictJourneyDigest } from "./strict-journey-digest.js";

/** How screens and exports show a strict journey digest. */
export class StrictJourneyDigestView {
  code: string;
  label: string;
  expiresAtText: string;
  bid: string;
  cohort: string;
  externalRef: string;
  ownerId: string;
  approved: string;
  archived: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    expiresAtText: string,
    bid: string,
    cohort: string,
    externalRef: string,
    ownerId: string,
    approved: string,
    archived: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAtText = expiresAtText;
    this.bid = bid;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.ownerId = ownerId;
    this.approved = approved;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toStrictJourneyDigestView(item: StrictJourneyDigest): StrictJourneyDigestView {
  return new StrictJourneyDigestView(
    item.code,
    item.label,
    String(item.expiresAt),
    item.bid.toFixed(2),
    item.cohort,
    text.truncate(item.externalRef, 120),
    item.ownerId,
    `${item.approved}`,
    `${item.archived}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictJourneyDigestViews(items: StrictJourneyDigest[]): StrictJourneyDigestView[] {
  const views: StrictJourneyDigestView[] = [];
  for (const item of items) {
    views.push(toStrictJourneyDigestView(item));
  }
  return views;
}

export function sumStrictJourneyDigestView(view: StrictJourneyDigestView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedExpiresAt + parsedBid + parsedDurationMinutes;
}
