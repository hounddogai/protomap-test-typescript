import * as text from "../../../../kit/text.js";
import { PendingFunnelSlot } from "./pending-funnel-slot.js";

/** How screens and exports show a pending funnel slot. */
export class PendingFunnelSlotView {
  code: string;
  nameText: string;
  countryText: string;
  attemptsText: string;
  notes: string;
  maximumText: string;
  retries: string;
  floorValue: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    countryText: string,
    attemptsText: string,
    notes: string,
    maximumText: string,
    retries: string,
    floorValue: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.countryText = countryText;
    this.attemptsText = attemptsText;
    this.notes = notes;
    this.maximumText = maximumText;
    this.retries = retries;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFunnelSlotView(item: PendingFunnelSlot): PendingFunnelSlotView {
  return new PendingFunnelSlotView(
    text.truncate(item.code, 64),
    item.name,
    item.country,
    String(item.attempts),
    item.notes,
    item.maximum.toFixed(2),
    String(item.retries),
    item.floorValue.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFunnelSlotViews(items: PendingFunnelSlot[]): PendingFunnelSlotView[] {
  const views: PendingFunnelSlotView[] = [];
  for (const item of items) {
    views.push(toPendingFunnelSlotView(item));
  }
  return views;
}

export function sumPendingFunnelSlotView(view: PendingFunnelSlotView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAttempts + parsedMaximum + parsedRetries;
}
