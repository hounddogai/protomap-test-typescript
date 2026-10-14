import * as text from "../../../../kit/text.js";
import { ScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

/** How screens and exports show a scheduled sender agreement. */
export class ScheduledSenderAgreementView {
  code: string;
  label: string;
  description: string;
  cost: string;
  variant: string;
  floorValue: string;
  frequencyCap: string;
  budget: string;
  clicks: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    cost: string,
    variant: string,
    floorValue: string,
    frequencyCap: string,
    budget: string,
    clicks: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.cost = cost;
    this.variant = variant;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.clicks = clicks;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSenderAgreementView(item: ScheduledSenderAgreement): ScheduledSenderAgreementView {
  return new ScheduledSenderAgreementView(
    text.truncate(item.code, 64),
    item.label,
    item.description,
    item.cost.toFixed(2),
    text.truncate(item.variant, 80),
    item.floorValue.toFixed(2),
    String(item.frequencyCap),
    item.budget.toFixed(2),
    String(item.clicks),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSenderAgreementViews(items: ScheduledSenderAgreement[]): ScheduledSenderAgreementView[] {
  const views: ScheduledSenderAgreementView[] = [];
  for (const item of items) {
    views.push(toScheduledSenderAgreementView(item));
  }
  return views;
}

export function sumScheduledSenderAgreementView(view: ScheduledSenderAgreementView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCost + parsedFloorValue + parsedFrequencyCap;
}
