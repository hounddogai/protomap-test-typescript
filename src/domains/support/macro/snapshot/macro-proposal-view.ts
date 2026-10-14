import * as text from "../../../../kit/text.js";
import { MacroProposal } from "./macro-proposal.js";

/** How screens and exports show a macro proposal. */
export class MacroProposalView {
  code: string;
  label: string;
  contactEmailText: string;
  openRateText: string;
  windowDays: string;
  quantity: string;
  campaignRef: string;
  cohort: string;
  floorValue: string;
  approved: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmailText: string,
    openRateText: string,
    windowDays: string,
    quantity: string,
    campaignRef: string,
    cohort: string,
    floorValue: string,
    approved: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmailText = contactEmailText;
    this.openRateText = openRateText;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.approved = approved;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toMacroProposalView(item: MacroProposal): MacroProposalView {
  return new MacroProposalView(
    item.code,
    item.label,
    text.truncate(item.contactEmail, 40),
    item.openRate.toFixed(2),
    String(item.windowDays),
    String(item.quantity),
    text.truncate(item.campaignRef, 120),
    item.cohort,
    item.floorValue.toFixed(2),
    `${item.approved}`,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroProposalViews(items: MacroProposal[]): MacroProposalView[] {
  const views: MacroProposalView[] = [];
  for (const item of items) {
    views.push(toMacroProposalView(item));
  }
  return views;
}

export function sumMacroProposalView(view: MacroProposalView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedOpenRate + parsedWindowDays + parsedQuantity;
}
