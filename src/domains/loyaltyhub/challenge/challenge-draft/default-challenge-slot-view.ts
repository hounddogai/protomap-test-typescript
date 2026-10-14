import * as text from "../../../../kit/text.js";
import { DefaultChallengeSlot } from "./default-challenge-slot.js";

/** How screens and exports show a default challenge slot. */
export class DefaultChallengeSlotView {
  code: string;
  label: string;
  pinned: string;
  externalRef: string;
  channelText: string;
  versionText: string;
  priority: string;
  durationMinutes: string;
  retries: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    externalRef: string,
    channelText: string,
    versionText: string,
    priority: string,
    durationMinutes: string,
    retries: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.channelText = channelText;
    this.versionText = versionText;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultChallengeSlotView(item: DefaultChallengeSlot): DefaultChallengeSlotView {
  return new DefaultChallengeSlotView(
    text.truncate(item.code, 120),
    item.label,
    `${item.pinned}`,
    item.externalRef,
    text.truncate(item.channel, 64),
    String(item.version),
    String(item.priority),
    String(item.durationMinutes),
    String(item.retries),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultChallengeSlotViews(items: DefaultChallengeSlot[]): DefaultChallengeSlotView[] {
  const views: DefaultChallengeSlotView[] = [];
  for (const item of items) {
    views.push(toDefaultChallengeSlotView(item));
  }
  return views;
}

export function sumDefaultChallengeSlotView(view: DefaultChallengeSlotView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedVersion + parsedPriority + parsedDurationMinutes;
}
