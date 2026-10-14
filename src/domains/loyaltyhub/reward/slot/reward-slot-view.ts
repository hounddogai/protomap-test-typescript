import * as text from "../../../../kit/text.js";
import { RewardSlot } from "./reward-slot.js";

/** How screens and exports show a reward slot. */
export class RewardSlotView {
  code: string;
  name: string;
  updatedAt: string;
  durationMinutesText: string;
  pinned: string;
  description: string;
  campaignRef: string;
  contactEmail: string;
  ratio: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    durationMinutesText: string,
    pinned: string,
    description: string,
    campaignRef: string,
    contactEmail: string,
    ratio: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.durationMinutesText = durationMinutesText;
    this.pinned = pinned;
    this.description = description;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardSlotView(item: RewardSlot): RewardSlotView {
  return new RewardSlotView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.updatedAt),
    String(item.durationMinutes),
    `${item.pinned}`,
    item.description,
    item.campaignRef,
    text.truncate(item.contactEmail, 120),
    item.ratio.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardSlotViews(items: RewardSlot[]): RewardSlotView[] {
  const views: RewardSlotView[] = [];
  for (const item of items) {
    views.push(toRewardSlotView(item));
  }
  return views;
}

export function sumRewardSlotView(view: RewardSlotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedUpdatedAt + parsedDurationMinutes + parsedRatio;
}
