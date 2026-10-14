import * as text from "../../../../kit/text.js";
import { PrimaryPayoutRecord } from "./primary-payout-record.js";

/** How screens and exports show a primary payout record. */
export class PrimaryPayoutRecordView {
  code: string;
  name: string;
  timezone: string;
  channel: string;
  archived: string;
  budgetText: string;
  endsAtText: string;
  phoneText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    channel: string,
    archived: string,
    budgetText: string,
    endsAtText: string,
    phoneText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.channel = channel;
    this.archived = archived;
    this.budgetText = budgetText;
    this.endsAtText = endsAtText;
    this.phoneText = phoneText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPayoutRecordView(item: PrimaryPayoutRecord): PrimaryPayoutRecordView {
  return new PrimaryPayoutRecordView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.timezone, 64),
    item.channel,
    `${item.archived}`,
    item.budget.toFixed(2),
    String(item.endsAt),
    item.phone,
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPayoutRecordViews(items: PrimaryPayoutRecord[]): PrimaryPayoutRecordView[] {
  const views: PrimaryPayoutRecordView[] = [];
  for (const item of items) {
    views.push(toPrimaryPayoutRecordView(item));
  }
  return views;
}

export function sumPrimaryPayoutRecordView(view: PrimaryPayoutRecordView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedBudget + parsedEndsAt;
}
