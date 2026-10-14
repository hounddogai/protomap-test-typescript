import * as text from "../../../../kit/text.js";
import { MentionSlot } from "./mention-slot.js";

/** How screens and exports show a mention slot. */
export class MentionSlotView {
  code: string;
  label: string;
  version: string;
  capacity: string;
  visible: string;
  unitText: string;
  countryText: string;
  durationMinutes: string;
  minimumText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    capacity: string,
    visible: string,
    unitText: string,
    countryText: string,
    durationMinutes: string,
    minimumText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.capacity = capacity;
    this.visible = visible;
    this.unitText = unitText;
    this.countryText = countryText;
    this.durationMinutes = durationMinutes;
    this.minimumText = minimumText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionSlotView(item: MentionSlot): MentionSlotView {
  return new MentionSlotView(
    text.truncate(item.code, 40),
    item.label,
    String(item.version),
    String(item.capacity),
    `${item.visible}`,
    item.unit,
    item.country,
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionSlotViews(items: MentionSlot[]): MentionSlotView[] {
  const views: MentionSlotView[] = [];
  for (const item of items) {
    views.push(toMentionSlotView(item));
  }
  return views;
}

export function sumMentionSlotView(view: MentionSlotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedVersion + parsedCapacity + parsedDurationMinutes;
}
