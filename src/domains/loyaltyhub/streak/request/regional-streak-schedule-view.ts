import * as text from "../../../../kit/text.js";
import { RegionalStreakSchedule } from "./regional-streak-schedule.js";

/** How screens and exports show a regional streak schedule. */
export class RegionalStreakScheduleView {
  code: string;
  labelText: string;
  archived: string;
  quantity: string;
  weight: string;
  sendAtText: string;
  approved: string;
  campaignRef: string;
  audienceIdText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    archived: string,
    quantity: string,
    weight: string,
    sendAtText: string,
    approved: string,
    campaignRef: string,
    audienceIdText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.archived = archived;
    this.quantity = quantity;
    this.weight = weight;
    this.sendAtText = sendAtText;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.audienceIdText = audienceIdText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalStreakScheduleView(item: RegionalStreakSchedule): RegionalStreakScheduleView {
  return new RegionalStreakScheduleView(
    text.truncate(item.code, 80),
    item.label,
    `${item.archived}`,
    String(item.quantity),
    item.weight.toFixed(2),
    String(item.sendAt),
    `${item.approved}`,
    item.campaignRef,
    item.audienceId,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalStreakScheduleViews(items: RegionalStreakSchedule[]): RegionalStreakScheduleView[] {
  const views: RegionalStreakScheduleView[] = [];
  for (const item of items) {
    views.push(toRegionalStreakScheduleView(item));
  }
  return views;
}

export function sumRegionalStreakScheduleView(view: RegionalStreakScheduleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedQuantity + parsedWeight + parsedSendAt;
}
