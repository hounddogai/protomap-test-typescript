import * as text from "../../../../kit/text.js";
import { ProofGroup } from "./proof-group.js";

/** How screens and exports show a proof group. */
export class ProofGroupView {
  code: string;
  title: string;
  openRate: string;
  budget: string;
  floorValue: string;
  amountText: string;
  timezone: string;
  conversionRate: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    budget: string,
    floorValue: string,
    amountText: string,
    timezone: string,
    conversionRate: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.budget = budget;
    this.floorValue = floorValue;
    this.amountText = amountText;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toProofGroupView(item: ProofGroup): ProofGroupView {
  return new ProofGroupView(
    item.code,
    text.truncate(item.title, 120),
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    item.floorValue.toFixed(2),
    item.amount.toFixed(2),
    text.truncate(item.timezone, 40),
    item.conversionRate.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofGroupViews(items: ProofGroup[]): ProofGroupView[] {
  const views: ProofGroupView[] = [];
  for (const item of items) {
    views.push(toProofGroupView(item));
  }
  return views;
}

export function sumProofGroupView(view: ProofGroupView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedOpenRate + parsedBudget + parsedFloorValue;
}
