import * as text from "../../../../kit/text.js";
import { RegionalStepOverride } from "./regional-step-override.js";

/** How screens and exports show a regional step override. */
export class RegionalStepOverrideView {
  code: string;
  labelText: string;
  active: string;
  retriesText: string;
  margin: string;
  phone: string;
  visible: string;
  discountText: string;
  contactEmail: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    active: string,
    retriesText: string,
    margin: string,
    phone: string,
    visible: string,
    discountText: string,
    contactEmail: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.active = active;
    this.retriesText = retriesText;
    this.margin = margin;
    this.phone = phone;
    this.visible = visible;
    this.discountText = discountText;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalStepOverrideView(item: RegionalStepOverride): RegionalStepOverrideView {
  return new RegionalStepOverrideView(
    item.code,
    item.label,
    `${item.active}`,
    String(item.retries),
    item.margin.toFixed(2),
    text.truncate(item.phone, 40),
    `${item.visible}`,
    item.discount.toFixed(2),
    item.contactEmail,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalStepOverrideViews(items: RegionalStepOverride[]): RegionalStepOverrideView[] {
  const views: RegionalStepOverrideView[] = [];
  for (const item of items) {
    views.push(toRegionalStepOverrideView(item));
  }
  return views;
}

export function sumRegionalStepOverrideView(view: RegionalStepOverrideView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedRetries + parsedMargin + parsedDiscount;
}
