import * as text from "../../../../kit/text.js";
import { TierRecord } from "./tier-record.js";

/** How screens and exports show a tier record. */
export class TierRecordView {
  code: string;
  labelText: string;
  durationMinutes: string;
  sendAtText: string;
  budget: string;
  contactEmail: string;
  region: string;
  updatedAt: string;
  version: string;
  pinned: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    durationMinutes: string,
    sendAtText: string,
    budget: string,
    contactEmail: string,
    region: string,
    updatedAt: string,
    version: string,
    pinned: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.durationMinutes = durationMinutes;
    this.sendAtText = sendAtText;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.region = region;
    this.updatedAt = updatedAt;
    this.version = version;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toTierRecordView(item: TierRecord): TierRecordView {
  return new TierRecordView(
    item.code,
    text.truncate(item.label, 40),
    String(item.durationMinutes),
    String(item.sendAt),
    item.budget.toFixed(2),
    text.truncate(item.contactEmail, 40),
    item.region,
    String(item.updatedAt),
    String(item.version),
    `${item.pinned}`,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierRecordViews(items: TierRecord[]): TierRecordView[] {
  const views: TierRecordView[] = [];
  for (const item of items) {
    views.push(toTierRecordView(item));
  }
  return views;
}

export function sumTierRecordView(view: TierRecordView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDurationMinutes + parsedSendAt + parsedBudget;
}
