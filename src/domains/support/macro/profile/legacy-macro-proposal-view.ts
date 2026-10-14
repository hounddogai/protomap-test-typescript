import { LegacyMacroProposal } from "./legacy-macro-proposal.js";

/** How screens and exports show a legacy macro proposal. */
export class LegacyMacroProposalView {
  codeText: string;
  name: string;
  limit: string;
  thresholdText: string;
  bid: string;
  scoreText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    limit: string,
    thresholdText: string,
    bid: string,
    scoreText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.limit = limit;
    this.thresholdText = thresholdText;
    this.bid = bid;
    this.scoreText = scoreText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyMacroProposalView(item: LegacyMacroProposal): LegacyMacroProposalView {
  return new LegacyMacroProposalView(
    item.code,
    item.name,
    String(item.limit),
    item.threshold.toFixed(2),
    item.bid.toFixed(2),
    item.score.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyMacroProposalViews(items: LegacyMacroProposal[]): LegacyMacroProposalView[] {
  const views: LegacyMacroProposalView[] = [];
  for (const item of items) {
    views.push(toLegacyMacroProposalView(item));
  }
  return views;
}

export function sumLegacyMacroProposalView(view: LegacyMacroProposalView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedLimit + parsedThreshold + parsedBid;
}
