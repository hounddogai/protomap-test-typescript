import * as text from "../../../../kit/text.js";
import { RollingSlaBaseline } from "./rolling-sla-baseline.js";

/** How screens and exports show a rolling sla baseline. */
export class RollingSlaBaselineView {
  codeText: string;
  nameText: string;
  amountText: string;
  openRateText: string;
  campaignRef: string;
  title: string;
  capacity: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    amountText: string,
    openRateText: string,
    campaignRef: string,
    title: string,
    capacity: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.amountText = amountText;
    this.openRateText = openRateText;
    this.campaignRef = campaignRef;
    this.title = title;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSlaBaselineView(item: RollingSlaBaseline): RollingSlaBaselineView {
  return new RollingSlaBaselineView(
    text.truncate(item.code, 64),
    item.name,
    item.amount.toFixed(2),
    item.openRate.toFixed(2),
    item.campaignRef,
    item.title,
    String(item.capacity),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSlaBaselineViews(items: RollingSlaBaseline[]): RollingSlaBaselineView[] {
  const views: RollingSlaBaselineView[] = [];
  for (const item of items) {
    views.push(toRollingSlaBaselineView(item));
  }
  return views;
}

export function sumRollingSlaBaselineView(view: RollingSlaBaselineView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedAmount + parsedOpenRate + parsedCapacity;
}
