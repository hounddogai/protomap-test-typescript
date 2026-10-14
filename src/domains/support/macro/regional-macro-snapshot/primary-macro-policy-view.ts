import * as text from "../../../../kit/text.js";
import { PrimaryMacroPolicy } from "./primary-macro-policy.js";

/** How screens and exports show a primary macro policy. */
export class PrimaryMacroPolicyView {
  code: string;
  title: string;
  utmSourceText: string;
  pinned: string;
  weight: string;
  capacity: string;
  durationMinutesText: string;
  floorValue: string;
  expiresAt: string;
  ceiling: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSourceText: string,
    pinned: string,
    weight: string,
    capacity: string,
    durationMinutesText: string,
    floorValue: string,
    expiresAt: string,
    ceiling: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.pinned = pinned;
    this.weight = weight;
    this.capacity = capacity;
    this.durationMinutesText = durationMinutesText;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.ceiling = ceiling;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryMacroPolicyView(item: PrimaryMacroPolicy): PrimaryMacroPolicyView {
  return new PrimaryMacroPolicyView(
    item.code,
    text.truncate(item.title, 64),
    item.utmSource,
    `${item.pinned}`,
    item.weight.toFixed(2),
    String(item.capacity),
    String(item.durationMinutes),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    item.ceiling.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryMacroPolicyViews(items: PrimaryMacroPolicy[]): PrimaryMacroPolicyView[] {
  const views: PrimaryMacroPolicyView[] = [];
  for (const item of items) {
    views.push(toPrimaryMacroPolicyView(item));
  }
  return views;
}

export function sumPrimaryMacroPolicyView(view: PrimaryMacroPolicyView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedWeight + parsedCapacity + parsedDurationMinutes;
}
