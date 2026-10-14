import * as text from "../../../../kit/text.js";
import { ScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

/** How screens and exports show a scheduled nudge profile. */
export class ScheduledNudgeProfileView {
  code: string;
  labelText: string;
  reviewer: string;
  minimum: string;
  sendAt: string;
  weight: string;
  discount: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    reviewer: string,
    minimum: string,
    sendAt: string,
    weight: string,
    discount: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.weight = weight;
    this.discount = discount;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledNudgeProfileView(item: ScheduledNudgeProfile): ScheduledNudgeProfileView {
  return new ScheduledNudgeProfileView(
    item.code,
    text.truncate(item.label, 80),
    item.reviewer,
    item.minimum.toFixed(2),
    String(item.sendAt),
    item.weight.toFixed(2),
    item.discount.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledNudgeProfileViews(items: ScheduledNudgeProfile[]): ScheduledNudgeProfileView[] {
  const views: ScheduledNudgeProfileView[] = [];
  for (const item of items) {
    views.push(toScheduledNudgeProfileView(item));
  }
  return views;
}

export function sumScheduledNudgeProfileView(view: ScheduledNudgeProfileView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMinimum + parsedSendAt + parsedWeight;
}
