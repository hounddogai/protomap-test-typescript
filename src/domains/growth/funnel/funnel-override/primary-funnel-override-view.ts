import * as text from "../../../../kit/text.js";
import { PrimaryFunnelOverride } from "./primary-funnel-override.js";

/** How screens and exports show a primary funnel override. */
export class PrimaryFunnelOverrideView {
  code: string;
  label: string;
  margin: string;
  budget: string;
  externalRef: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    budget: string,
    externalRef: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.budget = budget;
    this.externalRef = externalRef;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFunnelOverrideView(item: PrimaryFunnelOverride): PrimaryFunnelOverrideView {
  return new PrimaryFunnelOverrideView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.externalRef,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFunnelOverrideViews(items: PrimaryFunnelOverride[]): PrimaryFunnelOverrideView[] {
  const views: PrimaryFunnelOverrideView[] = [];
  for (const item of items) {
    views.push(toPrimaryFunnelOverrideView(item));
  }
  return views;
}

export function sumPrimaryFunnelOverrideView(view: PrimaryFunnelOverrideView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMargin + parsedBudget;
}
