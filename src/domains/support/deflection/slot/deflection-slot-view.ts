import * as text from "../../../../kit/text.js";
import { DeflectionSlot } from "./deflection-slot.js";

/** How screens and exports show a deflection slot. */
export class DeflectionSlotView {
  code: string;
  name: string;
  windowDays: string;
  region: string;
  createdAt: string;
  timezone: string;
  revisionText: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDays: string,
    region: string,
    createdAt: string,
    timezone: string,
    revisionText: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.region = region;
    this.createdAt = createdAt;
    this.timezone = timezone;
    this.revisionText = revisionText;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionSlotView(item: DeflectionSlot): DeflectionSlotView {
  return new DeflectionSlotView(
    item.code,
    text.truncate(item.name, 80),
    String(item.windowDays),
    item.region,
    String(item.createdAt),
    text.truncate(item.timezone, 80),
    String(item.revision),
    text.truncate(item.phone, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionSlotViews(items: DeflectionSlot[]): DeflectionSlotView[] {
  const views: DeflectionSlotView[] = [];
  for (const item of items) {
    views.push(toDeflectionSlotView(item));
  }
  return views;
}

export function sumDeflectionSlotView(view: DeflectionSlotView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedWindowDays + parsedCreatedAt + parsedRevision;
}
