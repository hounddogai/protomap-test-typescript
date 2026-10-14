import { SeasonalLevelProposal } from "./seasonal-level-proposal.js";

/** How screens and exports show a seasonal level proposal. */
export class SeasonalLevelProposalView {
  code: string;
  titleText: string;
  variant: string;
  createdAt: string;
  budget: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    variant: string,
    createdAt: string,
    budget: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.variant = variant;
    this.createdAt = createdAt;
    this.budget = budget;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLevelProposalView(item: SeasonalLevelProposal): SeasonalLevelProposalView {
  return new SeasonalLevelProposalView(
    item.code,
    item.title,
    item.variant,
    String(item.createdAt),
    item.budget.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLevelProposalViews(items: SeasonalLevelProposal[]): SeasonalLevelProposalView[] {
  const views: SeasonalLevelProposalView[] = [];
  for (const item of items) {
    views.push(toSeasonalLevelProposalView(item));
  }
  return views;
}

export function sumSeasonalLevelProposalView(view: SeasonalLevelProposalView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCreatedAt + parsedBudget;
}
