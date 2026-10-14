import * as text from "../../../../kit/text.js";
import { RegionalTierSlot } from "./regional-tier-slot.js";

/** How screens and exports show a regional tier slot. */
export class RegionalTierSlotView {
  code: string;
  name: string;
  versionText: string;
  sendAt: string;
  pinnedText: string;
  summary: string;
  country: string;
  notes: string;
  phone: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    versionText: string,
    sendAt: string,
    pinnedText: string,
    summary: string,
    country: string,
    notes: string,
    phone: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.versionText = versionText;
    this.sendAt = sendAt;
    this.pinnedText = pinnedText;
    this.summary = summary;
    this.country = country;
    this.notes = notes;
    this.phone = phone;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTierSlotView(item: RegionalTierSlot): RegionalTierSlotView {
  return new RegionalTierSlotView(
    item.code,
    item.name,
    String(item.version),
    String(item.sendAt),
    `${item.pinned}`,
    item.summary,
    item.country,
    item.notes,
    item.phone,
    text.truncate(item.unit, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTierSlotViews(items: RegionalTierSlot[]): RegionalTierSlotView[] {
  const views: RegionalTierSlotView[] = [];
  for (const item of items) {
    views.push(toRegionalTierSlotView(item));
  }
  return views;
}

export function sumRegionalTierSlotView(view: RegionalTierSlotView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedVersion + parsedSendAt;
}
