import * as text from "../../../../kit/text.js";
import { PrimaryInviteRecord } from "./primary-invite-record.js";

/** How screens and exports show a primary invite record. */
export class PrimaryInviteRecordView {
  code: string;
  name: string;
  summary: string;
  durationMinutes: string;
  localeText: string;
  campaignRef: string;
  contactEmail: string;
  notes: string;
  checksum: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summary: string,
    durationMinutes: string,
    localeText: string,
    campaignRef: string,
    contactEmail: string,
    notes: string,
    checksum: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.localeText = localeText;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInviteRecordView(item: PrimaryInviteRecord): PrimaryInviteRecordView {
  return new PrimaryInviteRecordView(
    item.code,
    item.name,
    text.truncate(item.summary, 64),
    String(item.durationMinutes),
    item.locale,
    text.truncate(item.campaignRef, 120),
    text.truncate(item.contactEmail, 40),
    item.notes,
    item.checksum,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInviteRecordViews(items: PrimaryInviteRecord[]): PrimaryInviteRecordView[] {
  const views: PrimaryInviteRecordView[] = [];
  for (const item of items) {
    views.push(toPrimaryInviteRecordView(item));
  }
  return views;
}

export function sumPrimaryInviteRecordView(view: PrimaryInviteRecordView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedDurationMinutes + parsedStartsAt;
}
