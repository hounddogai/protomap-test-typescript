import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

/** How screens and exports show a scheduled deflection slot. */
export class ScheduledDeflectionSlotView {
  code: string;
  name: string;
  attemptsText: string;
  updatedAtText: string;
  utmSource: string;
  currency: string;
  journeyId: string;
  sendAt: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attemptsText: string,
    updatedAtText: string,
    utmSource: string,
    currency: string,
    journeyId: string,
    sendAt: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attemptsText = attemptsText;
    this.updatedAtText = updatedAtText;
    this.utmSource = utmSource;
    this.currency = currency;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDeflectionSlotView(item: ScheduledDeflectionSlot): ScheduledDeflectionSlotView {
  return new ScheduledDeflectionSlotView(
    text.truncate(item.code, 120),
    item.name,
    String(item.attempts),
    String(item.updatedAt),
    item.utmSource,
    item.currency,
    item.journeyId,
    String(item.sendAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDeflectionSlotViews(items: ScheduledDeflectionSlot[]): ScheduledDeflectionSlotView[] {
  const views: ScheduledDeflectionSlotView[] = [];
  for (const item of items) {
    views.push(toScheduledDeflectionSlotView(item));
  }
  return views;
}

export function sumScheduledDeflectionSlotView(view: ScheduledDeflectionSlotView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedAttempts + parsedUpdatedAt + parsedSendAt;
}
