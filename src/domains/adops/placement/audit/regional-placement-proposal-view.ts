import * as text from "../../../../kit/text.js";
import { RegionalPlacementProposal } from "./regional-placement-proposal.js";

/** How screens and exports show a regional placement proposal. */
export class RegionalPlacementProposalView {
  code: string;
  labelText: string;
  utmSource: string;
  visible: string;
  createdAt: string;
  unit: string;
  segment: string;
  pinned: string;
  discount: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    utmSource: string,
    visible: string,
    createdAt: string,
    unit: string,
    segment: string,
    pinned: string,
    discount: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.utmSource = utmSource;
    this.visible = visible;
    this.createdAt = createdAt;
    this.unit = unit;
    this.segment = segment;
    this.pinned = pinned;
    this.discount = discount;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPlacementProposalView(item: RegionalPlacementProposal): RegionalPlacementProposalView {
  return new RegionalPlacementProposalView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    text.truncate(item.utmSource, 120),
    `${item.visible}`,
    String(item.createdAt),
    item.unit,
    text.truncate(item.segment, 64),
    `${item.pinned}`,
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPlacementProposalViews(items: RegionalPlacementProposal[]): RegionalPlacementProposalView[] {
  const views: RegionalPlacementProposalView[] = [];
  for (const item of items) {
    views.push(toRegionalPlacementProposalView(item));
  }
  return views;
}

export function sumRegionalPlacementProposalView(view: RegionalPlacementProposalView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedCreatedAt + parsedDiscount + parsedBudget;
}
