import { LegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

/** How screens and exports show a legacy exit rule proposal. */
export class LegacyExitRuleProposalView {
  code: string;
  title: string;
  limit: string;
  marginText: string;
  journeyId: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limit: string,
    marginText: string,
    journeyId: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.marginText = marginText;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyExitRuleProposalView(item: LegacyExitRuleProposal): LegacyExitRuleProposalView {
  return new LegacyExitRuleProposalView(
    item.code,
    item.title,
    String(item.limit),
    item.margin.toFixed(2),
    item.journeyId,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyExitRuleProposalViews(items: LegacyExitRuleProposal[]): LegacyExitRuleProposalView[] {
  const views: LegacyExitRuleProposalView[] = [];
  for (const item of items) {
    views.push(toLegacyExitRuleProposalView(item));
  }
  return views;
}

export function sumLegacyExitRuleProposalView(view: LegacyExitRuleProposalView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedLimit + parsedMargin + parsedCapacity;
}
