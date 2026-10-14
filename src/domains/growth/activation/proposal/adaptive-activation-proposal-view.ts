import * as text from "../../../../kit/text.js";
import { AdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

/** How screens and exports show a adaptive activation proposal. */
export class AdaptiveActivationProposalView {
  codeText: string;
  labelText: string;
  utmSourceText: string;
  budget: string;
  ownerIdText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    utmSourceText: string,
    budget: string,
    ownerIdText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.utmSourceText = utmSourceText;
    this.budget = budget;
    this.ownerIdText = ownerIdText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveActivationProposalView(item: AdaptiveActivationProposal): AdaptiveActivationProposalView {
  return new AdaptiveActivationProposalView(
    item.code,
    item.label,
    item.utmSource,
    item.budget.toFixed(2),
    text.truncate(item.ownerId, 120),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveActivationProposalViews(items: AdaptiveActivationProposal[]): AdaptiveActivationProposalView[] {
  const views: AdaptiveActivationProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveActivationProposalView(item));
  }
  return views;
}

export function sumAdaptiveActivationProposalView(view: AdaptiveActivationProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
