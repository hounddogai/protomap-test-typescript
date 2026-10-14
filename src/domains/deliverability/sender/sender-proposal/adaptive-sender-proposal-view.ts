import * as text from "../../../../kit/text.js";
import { AdaptiveSenderProposal } from "./adaptive-sender-proposal.js";

/** How screens and exports show a adaptive sender proposal. */
export class AdaptiveSenderProposalView {
  codeText: string;
  label: string;
  categoryText: string;
  scoreText: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    categoryText: string,
    scoreText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.categoryText = categoryText;
    this.scoreText = scoreText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSenderProposalView(item: AdaptiveSenderProposal): AdaptiveSenderProposalView {
  return new AdaptiveSenderProposalView(
    item.code,
    text.truncate(item.label, 64),
    item.category,
    item.score.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSenderProposalViews(items: AdaptiveSenderProposal[]): AdaptiveSenderProposalView[] {
  const views: AdaptiveSenderProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSenderProposalView(item));
  }
  return views;
}

export function sumAdaptiveSenderProposalView(view: AdaptiveSenderProposalView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
