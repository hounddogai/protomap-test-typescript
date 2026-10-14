import * as text from "../../../../kit/text.js";
import { SeasonalMacroProposal } from "./seasonal-macro-proposal.js";

/** How screens and exports show a seasonal macro proposal. */
export class SeasonalMacroProposalView {
  codeText: string;
  name: string;
  minimum: string;
  budgetText: string;
  country: string;
  channel: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    minimum: string,
    budgetText: string,
    country: string,
    channel: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.country = country;
    this.channel = channel;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMacroProposalView(item: SeasonalMacroProposal): SeasonalMacroProposalView {
  return new SeasonalMacroProposalView(
    item.code,
    text.truncate(item.name, 40),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.country,
    text.truncate(item.channel, 80),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMacroProposalViews(items: SeasonalMacroProposal[]): SeasonalMacroProposalView[] {
  const views: SeasonalMacroProposalView[] = [];
  for (const item of items) {
    views.push(toSeasonalMacroProposalView(item));
  }
  return views;
}

export function sumSeasonalMacroProposalView(view: SeasonalMacroProposalView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedMinimum + parsedBudget + parsedExpiresAt;
}
