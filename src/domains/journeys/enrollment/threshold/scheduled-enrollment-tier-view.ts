import * as text from "../../../../kit/text.js";
import { ScheduledEnrollmentTier } from "./scheduled-enrollment-tier.js";

/** How screens and exports show a scheduled enrollment tier. */
export class ScheduledEnrollmentTierView {
  code: string;
  title: string;
  label: string;
  quantity: string;
  threshold: string;
  description: string;
  segment: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    label: string,
    quantity: string,
    threshold: string,
    description: string,
    segment: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.quantity = quantity;
    this.threshold = threshold;
    this.description = description;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledEnrollmentTierView(item: ScheduledEnrollmentTier): ScheduledEnrollmentTierView {
  return new ScheduledEnrollmentTierView(
    item.code,
    item.title,
    text.truncate(item.label, 64),
    String(item.quantity),
    item.threshold.toFixed(2),
    item.description,
    text.truncate(item.segment, 40),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledEnrollmentTierViews(items: ScheduledEnrollmentTier[]): ScheduledEnrollmentTierView[] {
  const views: ScheduledEnrollmentTierView[] = [];
  for (const item of items) {
    views.push(toScheduledEnrollmentTierView(item));
  }
  return views;
}

export function sumScheduledEnrollmentTierView(view: ScheduledEnrollmentTierView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedQuantity + parsedThreshold + parsedFrequencyCap;
}
