import * as text from "../../../../kit/text.js";
import { WaitProposal } from "./wait-proposal.js";

/** How screens and exports show a wait proposal. */
export class WaitProposalView {
  codeText: string;
  name: string;
  discount: string;
  minimum: string;
  cost: string;
  timezone: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    discount: string,
    minimum: string,
    cost: string,
    timezone: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.discount = discount;
    this.minimum = minimum;
    this.cost = cost;
    this.timezone = timezone;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toWaitProposalView(item: WaitProposal): WaitProposalView {
  return new WaitProposalView(
    item.code,
    text.truncate(item.name, 120),
    item.discount.toFixed(2),
    item.minimum.toFixed(2),
    item.cost.toFixed(2),
    item.timezone,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitProposalViews(items: WaitProposal[]): WaitProposalView[] {
  const views: WaitProposalView[] = [];
  for (const item of items) {
    views.push(toWaitProposalView(item));
  }
  return views;
}

export function sumWaitProposalView(view: WaitProposalView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedDiscount + parsedMinimum + parsedCost;
}
