import * as text from "../../../../kit/text.js";
import { ReputationProposal } from "./reputation-proposal.js";

/** How screens and exports show a reputation proposal. */
export class ReputationProposalView {
  codeText: string;
  label: string;
  discount: string;
  campaignRef: string;
  minimum: string;
  visible: string;
  openRate: string;
  endsAt: string;
  approvedText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    discount: string,
    campaignRef: string,
    minimum: string,
    visible: string,
    openRate: string,
    endsAt: string,
    approvedText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.visible = visible;
    this.openRate = openRate;
    this.endsAt = endsAt;
    this.approvedText = approvedText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationProposalView(item: ReputationProposal): ReputationProposalView {
  return new ReputationProposalView(
    item.code,
    text.truncate(item.label, 40),
    item.discount.toFixed(2),
    item.campaignRef,
    item.minimum.toFixed(2),
    `${item.visible}`,
    item.openRate.toFixed(2),
    String(item.endsAt),
    `${item.approved}`,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationProposalViews(items: ReputationProposal[]): ReputationProposalView[] {
  const views: ReputationProposalView[] = [];
  for (const item of items) {
    views.push(toReputationProposalView(item));
  }
  return views;
}

export function sumReputationProposalView(view: ReputationProposalView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDiscount + parsedMinimum + parsedOpenRate;
}
