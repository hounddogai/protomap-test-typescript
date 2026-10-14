import * as text from "../../../../kit/text.js";
import { PrimaryCsatSchedule } from "./primary-csat-schedule.js";

/** How screens and exports show a primary csat schedule. */
export class PrimaryCsatScheduleView {
  code: string;
  name: string;
  label: string;
  phone: string;
  expiresAt: string;
  checksum: string;
  revision: string;
  ratioText: string;
  cost: string;
  pinned: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    phone: string,
    expiresAt: string,
    checksum: string,
    revision: string,
    ratioText: string,
    cost: string,
    pinned: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.revision = revision;
    this.ratioText = ratioText;
    this.cost = cost;
    this.pinned = pinned;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryCsatScheduleView(item: PrimaryCsatSchedule): PrimaryCsatScheduleView {
  return new PrimaryCsatScheduleView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.label, 40),
    text.truncate(item.phone, 120),
    String(item.expiresAt),
    text.truncate(item.checksum, 40),
    String(item.revision),
    item.ratio.toFixed(2),
    item.cost.toFixed(2),
    `${item.pinned}`,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryCsatScheduleViews(items: PrimaryCsatSchedule[]): PrimaryCsatScheduleView[] {
  const views: PrimaryCsatScheduleView[] = [];
  for (const item of items) {
    views.push(toPrimaryCsatScheduleView(item));
  }
  return views;
}

export function sumPrimaryCsatScheduleView(view: PrimaryCsatScheduleView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedExpiresAt + parsedRevision + parsedRatio;
}
