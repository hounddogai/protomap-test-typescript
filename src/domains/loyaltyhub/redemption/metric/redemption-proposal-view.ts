import * as text from "../../../../kit/text.js";
import { RedemptionProposal } from "./redemption-proposal.js";

/** How screens and exports show a redemption proposal. */
export class RedemptionProposalView {
  code: string;
  label: string;
  bidText: string;
  cost: string;
  journeyIdText: string;
  name: string;
  revision: string;
  activeText: string;
  priority: string;
  endsAt: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    bidText: string,
    cost: string,
    journeyIdText: string,
    name: string,
    revision: string,
    activeText: string,
    priority: string,
    endsAt: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.bidText = bidText;
    this.cost = cost;
    this.journeyIdText = journeyIdText;
    this.name = name;
    this.revision = revision;
    this.activeText = activeText;
    this.priority = priority;
    this.endsAt = endsAt;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionProposalView(item: RedemptionProposal): RedemptionProposalView {
  return new RedemptionProposalView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.journeyId, 80),
    text.truncate(item.name, 120),
    String(item.revision),
    `${item.active}`,
    String(item.priority),
    String(item.endsAt),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionProposalViews(items: RedemptionProposal[]): RedemptionProposalView[] {
  const views: RedemptionProposalView[] = [];
  for (const item of items) {
    views.push(toRedemptionProposalView(item));
  }
  return views;
}

export function sumRedemptionProposalView(view: RedemptionProposalView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBid + parsedCost + parsedRevision;
}
