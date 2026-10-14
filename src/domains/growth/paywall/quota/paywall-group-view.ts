import * as text from "../../../../kit/text.js";
import { PaywallGroup } from "./paywall-group.js";

/** How screens and exports show a paywall group. */
export class PaywallGroupView {
  code: string;
  title: string;
  budget: string;
  channelText: string;
  floorValue: string;
  notes: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    channelText: string,
    floorValue: string,
    notes: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.channelText = channelText;
    this.floorValue = floorValue;
    this.notes = notes;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallGroupView(item: PaywallGroup): PaywallGroupView {
  return new PaywallGroupView(
    item.code,
    text.truncate(item.title, 64),
    item.budget.toFixed(2),
    item.channel,
    item.floorValue.toFixed(2),
    text.truncate(item.notes, 120),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallGroupViews(items: PaywallGroup[]): PaywallGroupView[] {
  const views: PaywallGroupView[] = [];
  for (const item of items) {
    views.push(toPaywallGroupView(item));
  }
  return views;
}

export function sumPaywallGroupView(view: PaywallGroupView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedBudget + parsedFloorValue;
}
