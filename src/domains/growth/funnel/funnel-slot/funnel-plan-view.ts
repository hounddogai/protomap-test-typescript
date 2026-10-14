import * as text from "../../../../kit/text.js";
import { FunnelPlan } from "./funnel-plan.js";

/** How screens and exports show a funnel plan. */
export class FunnelPlanView {
  code: string;
  name: string;
  retries: string;
  phoneText: string;
  openRateText: string;
  labelText: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    phoneText: string,
    openRateText: string,
    labelText: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.phoneText = phoneText;
    this.openRateText = openRateText;
    this.labelText = labelText;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelPlanView(item: FunnelPlan): FunnelPlanView {
  return new FunnelPlanView(
    item.code,
    item.name,
    String(item.retries),
    item.phone,
    item.openRate.toFixed(2),
    item.label,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelPlanViews(items: FunnelPlan[]): FunnelPlanView[] {
  const views: FunnelPlanView[] = [];
  for (const item of items) {
    views.push(toFunnelPlanView(item));
  }
  return views;
}

export function sumFunnelPlanView(view: FunnelPlanView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRetries + parsedOpenRate;
}
