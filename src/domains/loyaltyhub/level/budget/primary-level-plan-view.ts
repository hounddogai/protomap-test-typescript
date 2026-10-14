import * as text from "../../../../kit/text.js";
import { PrimaryLevelPlan } from "./primary-level-plan.js";

/** How screens and exports show a primary level plan. */
export class PrimaryLevelPlanView {
  code: string;
  name: string;
  bid: string;
  unitText: string;
  discount: string;
  frequencyCap: string;
  phone: string;
  channel: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    unitText: string,
    discount: string,
    frequencyCap: string,
    phone: string,
    channel: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.unitText = unitText;
    this.discount = discount;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.channel = channel;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryLevelPlanView(item: PrimaryLevelPlan): PrimaryLevelPlanView {
  return new PrimaryLevelPlanView(
    item.code,
    text.truncate(item.name, 40),
    item.bid.toFixed(2),
    item.unit,
    item.discount.toFixed(2),
    String(item.frequencyCap),
    item.phone,
    text.truncate(item.channel, 120),
    text.truncate(item.source, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryLevelPlanViews(items: PrimaryLevelPlan[]): PrimaryLevelPlanView[] {
  const views: PrimaryLevelPlanView[] = [];
  for (const item of items) {
    views.push(toPrimaryLevelPlanView(item));
  }
  return views;
}

export function sumPrimaryLevelPlanView(view: PrimaryLevelPlanView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedBid + parsedDiscount + parsedFrequencyCap;
}
