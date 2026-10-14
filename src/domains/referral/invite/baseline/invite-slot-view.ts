import * as text from "../../../../kit/text.js";
import { InviteSlot } from "./invite-slot.js";

/** How screens and exports show a invite slot. */
export class InviteSlotView {
  codeText: string;
  label: string;
  priority: string;
  endsAt: string;
  windowDaysText: string;
  unitText: string;
  contactEmail: string;
  campaignRef: string;
  ceilingText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    endsAt: string,
    windowDaysText: string,
    unitText: string,
    contactEmail: string,
    campaignRef: string,
    ceilingText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.endsAt = endsAt;
    this.windowDaysText = windowDaysText;
    this.unitText = unitText;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.ceilingText = ceilingText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toInviteSlotView(item: InviteSlot): InviteSlotView {
  return new InviteSlotView(
    item.code,
    text.truncate(item.label, 80),
    String(item.priority),
    String(item.endsAt),
    String(item.windowDays),
    item.unit,
    item.contactEmail,
    item.campaignRef,
    item.ceiling.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteSlotViews(items: InviteSlot[]): InviteSlotView[] {
  const views: InviteSlotView[] = [];
  for (const item of items) {
    views.push(toInviteSlotView(item));
  }
  return views;
}

export function sumInviteSlotView(view: InviteSlotView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedPriority + parsedEndsAt + parsedWindowDays;
}
