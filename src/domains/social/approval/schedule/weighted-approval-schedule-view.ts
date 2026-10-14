import * as text from "../../../../kit/text.js";
import { WeightedApprovalSchedule } from "./weighted-approval-schedule.js";

/** How screens and exports show a weighted approval schedule. */
export class WeightedApprovalScheduleView {
  code: string;
  name: string;
  discount: string;
  endsAt: string;
  frequencyCap: string;
  notes: string;
  amountText: string;
  ratio: string;
  campaignRefText: string;
  cohort: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    discount: string,
    endsAt: string,
    frequencyCap: string,
    notes: string,
    amountText: string,
    ratio: string,
    campaignRefText: string,
    cohort: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.amountText = amountText;
    this.ratio = ratio;
    this.campaignRefText = campaignRefText;
    this.cohort = cohort;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedApprovalScheduleView(item: WeightedApprovalSchedule): WeightedApprovalScheduleView {
  return new WeightedApprovalScheduleView(
    text.truncate(item.code, 64),
    item.name,
    item.discount.toFixed(2),
    String(item.endsAt),
    String(item.frequencyCap),
    item.notes,
    item.amount.toFixed(2),
    item.ratio.toFixed(2),
    item.campaignRef,
    item.cohort,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedApprovalScheduleViews(items: WeightedApprovalSchedule[]): WeightedApprovalScheduleView[] {
  const views: WeightedApprovalScheduleView[] = [];
  for (const item of items) {
    views.push(toWeightedApprovalScheduleView(item));
  }
  return views;
}

export function sumWeightedApprovalScheduleView(view: WeightedApprovalScheduleView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedDiscount + parsedEndsAt + parsedFrequencyCap;
}
