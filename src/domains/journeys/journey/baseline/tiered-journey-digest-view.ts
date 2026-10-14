import * as text from "../../../../kit/text.js";
import { TieredJourneyDigest } from "./tiered-journey-digest.js";

/** How screens and exports show a tiered journey digest. */
export class TieredJourneyDigestView {
  code: string;
  label: string;
  frequencyCap: string;
  source: string;
  createdAt: string;
  campaignRef: string;
  journeyIdText: string;
  contactEmail: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    source: string,
    createdAt: string,
    campaignRef: string,
    journeyIdText: string,
    contactEmail: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.journeyIdText = journeyIdText;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toTieredJourneyDigestView(item: TieredJourneyDigest): TieredJourneyDigestView {
  return new TieredJourneyDigestView(
    item.code,
    text.truncate(item.label, 80),
    String(item.frequencyCap),
    item.source,
    String(item.createdAt),
    text.truncate(item.campaignRef, 80),
    item.journeyId,
    item.contactEmail,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredJourneyDigestViews(items: TieredJourneyDigest[]): TieredJourneyDigestView[] {
  const views: TieredJourneyDigestView[] = [];
  for (const item of items) {
    views.push(toTieredJourneyDigestView(item));
  }
  return views;
}

export function sumTieredJourneyDigestView(view: TieredJourneyDigestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedFrequencyCap + parsedCreatedAt + parsedCapacity;
}
