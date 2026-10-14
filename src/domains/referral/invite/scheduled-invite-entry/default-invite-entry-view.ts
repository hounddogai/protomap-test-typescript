import * as text from "../../../../kit/text.js";
import { DefaultInviteEntry } from "./default-invite-entry.js";

/** How screens and exports show a default invite entry. */
export class DefaultInviteEntryView {
  code: string;
  nameText: string;
  margin: string;
  pinned: string;
  checksum: string;
  phone: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    margin: string,
    pinned: string,
    checksum: string,
    phone: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.margin = margin;
    this.pinned = pinned;
    this.checksum = checksum;
    this.phone = phone;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInviteEntryView(item: DefaultInviteEntry): DefaultInviteEntryView {
  return new DefaultInviteEntryView(
    text.truncate(item.code, 64),
    item.name,
    item.margin.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.checksum, 64),
    text.truncate(item.phone, 80),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInviteEntryViews(items: DefaultInviteEntry[]): DefaultInviteEntryView[] {
  const views: DefaultInviteEntryView[] = [];
  for (const item of items) {
    views.push(toDefaultInviteEntryView(item));
  }
  return views;
}

export function sumDefaultInviteEntryView(view: DefaultInviteEntryView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedMargin + parsedFloorValue;
}
