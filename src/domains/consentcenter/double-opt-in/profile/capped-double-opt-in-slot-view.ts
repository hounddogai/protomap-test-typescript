import * as text from "../../../../kit/text.js";
import { CappedDoubleOptInSlot } from "./capped-double-opt-in-slot.js";

/** How screens and exports show a capped double opt in slot. */
export class CappedDoubleOptInSlotView {
  code: string;
  nameText: string;
  audienceId: string;
  visibleText: string;
  titleText: string;
  phone: string;
  attempts: string;
  archived: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    audienceId: string,
    visibleText: string,
    titleText: string,
    phone: string,
    attempts: string,
    archived: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.visibleText = visibleText;
    this.titleText = titleText;
    this.phone = phone;
    this.attempts = attempts;
    this.archived = archived;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDoubleOptInSlotView(item: CappedDoubleOptInSlot): CappedDoubleOptInSlotView {
  return new CappedDoubleOptInSlotView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 64),
    text.truncate(item.audienceId, 64),
    `${item.visible}`,
    item.title,
    text.truncate(item.phone, 40),
    String(item.attempts),
    `${item.archived}`,
    text.truncate(item.variant, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDoubleOptInSlotViews(items: CappedDoubleOptInSlot[]): CappedDoubleOptInSlotView[] {
  const views: CappedDoubleOptInSlotView[] = [];
  for (const item of items) {
    views.push(toCappedDoubleOptInSlotView(item));
  }
  return views;
}

export function sumCappedDoubleOptInSlotView(view: CappedDoubleOptInSlotView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
