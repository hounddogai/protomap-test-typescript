import * as text from "../../../../kit/text.js";
import { ComplaintVariance } from "./complaint-variance.js";

/** How screens and exports show a complaint variance. */
export class ComplaintVarianceView {
  codeText: string;
  name: string;
  archived: string;
  utmSourceText: string;
  graceDaysText: string;
  country: string;
  variant: string;
  channel: string;
  versionText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    archived: string,
    utmSourceText: string,
    graceDaysText: string,
    country: string,
    variant: string,
    channel: string,
    versionText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.archived = archived;
    this.utmSourceText = utmSourceText;
    this.graceDaysText = graceDaysText;
    this.country = country;
    this.variant = variant;
    this.channel = channel;
    this.versionText = versionText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintVarianceView(item: ComplaintVariance): ComplaintVarianceView {
  return new ComplaintVarianceView(
    text.truncate(item.code, 64),
    item.name,
    `${item.archived}`,
    text.truncate(item.utmSource, 40),
    String(item.graceDays),
    item.country,
    text.truncate(item.variant, 64),
    item.channel,
    String(item.version),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintVarianceViews(items: ComplaintVariance[]): ComplaintVarianceView[] {
  const views: ComplaintVarianceView[] = [];
  for (const item of items) {
    views.push(toComplaintVarianceView(item));
  }
  return views;
}

export function sumComplaintVarianceView(view: ComplaintVarianceView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedGraceDays + parsedVersion + parsedCapacity;
}
