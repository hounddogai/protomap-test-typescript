import * as text from "../../../../kit/text.js";
import { FallbackInvitePreference } from "./fallback-invite-preference.js";

/** How screens and exports show a fallback invite preference. */
export class FallbackInvitePreferenceView {
  code: string;
  title: string;
  capacity: string;
  timezone: string;
  frequencyCap: string;
  cost: string;
  scoreText: string;
  amountText: string;
  discount: string;
  approved: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacity: string,
    timezone: string,
    frequencyCap: string,
    cost: string,
    scoreText: string,
    amountText: string,
    discount: string,
    approved: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.scoreText = scoreText;
    this.amountText = amountText;
    this.discount = discount;
    this.approved = approved;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackInvitePreferenceView(item: FallbackInvitePreference): FallbackInvitePreferenceView {
  return new FallbackInvitePreferenceView(
    item.code,
    text.truncate(item.title, 40),
    String(item.capacity),
    item.timezone,
    String(item.frequencyCap),
    item.cost.toFixed(2),
    item.score.toFixed(2),
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    `${item.approved}`,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackInvitePreferenceViews(items: FallbackInvitePreference[]): FallbackInvitePreferenceView[] {
  const views: FallbackInvitePreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackInvitePreferenceView(item));
  }
  return views;
}

export function sumFallbackInvitePreferenceView(view: FallbackInvitePreferenceView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCapacity + parsedFrequencyCap + parsedCost;
}
