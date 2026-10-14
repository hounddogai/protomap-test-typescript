import { FallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

/** How screens and exports show a fallback ticket view slot. */
export class FallbackTicketViewSlotView {
  code: string;
  nameText: string;
  approved: string;
  checksum: string;
  title: string;
  minimum: string;
  createdAt: string;
  windowDaysText: string;
  categoryText: string;
  versionText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    approved: string,
    checksum: string,
    title: string,
    minimum: string,
    createdAt: string,
    windowDaysText: string,
    categoryText: string,
    versionText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.approved = approved;
    this.checksum = checksum;
    this.title = title;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.windowDaysText = windowDaysText;
    this.categoryText = categoryText;
    this.versionText = versionText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackTicketViewSlotView(item: FallbackTicketViewSlot): FallbackTicketViewSlotView {
  return new FallbackTicketViewSlotView(
    item.code,
    item.name,
    `${item.approved}`,
    item.checksum,
    item.title,
    item.minimum.toFixed(2),
    String(item.createdAt),
    String(item.windowDays),
    item.category,
    String(item.version),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackTicketViewSlotViews(items: FallbackTicketViewSlot[]): FallbackTicketViewSlotView[] {
  const views: FallbackTicketViewSlotView[] = [];
  for (const item of items) {
    views.push(toFallbackTicketViewSlotView(item));
  }
  return views;
}

export function sumFallbackTicketViewSlotView(view: FallbackTicketViewSlotView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedMinimum + parsedCreatedAt + parsedWindowDays;
}
