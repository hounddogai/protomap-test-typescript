import * as text from "../../../../kit/text.js";
import { StrictEscalationAdjustment } from "./strict-escalation-adjustment.js";

/** How screens and exports show a strict escalation adjustment. */
export class StrictEscalationAdjustmentView {
  code: string;
  name: string;
  discount: string;
  rate: string;
  regionText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    discount: string,
    rate: string,
    regionText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.rate = rate;
    this.regionText = regionText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toStrictEscalationAdjustmentView(item: StrictEscalationAdjustment): StrictEscalationAdjustmentView {
  return new StrictEscalationAdjustmentView(
    item.code,
    item.name,
    item.discount.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.region, 80),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictEscalationAdjustmentViews(items: StrictEscalationAdjustment[]): StrictEscalationAdjustmentView[] {
  const views: StrictEscalationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictEscalationAdjustmentView(item));
  }
  return views;
}

export function sumStrictEscalationAdjustmentView(view: StrictEscalationAdjustmentView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedDiscount + parsedRate;
}
