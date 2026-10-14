import * as text from "../../../../kit/text.js";
import { WaitPlan } from "./wait-plan.js";

/** How screens and exports show a wait plan. */
export class WaitPlanView {
  codeText: string;
  title: string;
  floorValue: string;
  approved: string;
  margin: string;
  discountText: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    floorValue: string,
    approved: string,
    margin: string,
    discountText: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.floorValue = floorValue;
    this.approved = approved;
    this.margin = margin;
    this.discountText = discountText;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitPlanView(item: WaitPlan): WaitPlanView {
  return new WaitPlanView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    `${item.approved}`,
    item.margin.toFixed(2),
    item.discount.toFixed(2),
    text.truncate(item.contactEmail, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitPlanViews(items: WaitPlan[]): WaitPlanView[] {
  const views: WaitPlanView[] = [];
  for (const item of items) {
    views.push(toWaitPlanView(item));
  }
  return views;
}

export function sumWaitPlanView(view: WaitPlanView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedFloorValue + parsedMargin + parsedDiscount;
}
