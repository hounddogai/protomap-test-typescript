import * as text from "../../../../kit/text.js";
import { CsatProposal } from "./csat-proposal.js";

/** How screens and exports show a csat proposal. */
export class CsatProposalView {
  code: string;
  labelText: string;
  scoreText: string;
  marginText: string;
  attempts: string;
  category: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    scoreText: string,
    marginText: string,
    attempts: string,
    category: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.scoreText = scoreText;
    this.marginText = marginText;
    this.attempts = attempts;
    this.category = category;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatProposalView(item: CsatProposal): CsatProposalView {
  return new CsatProposalView(
    text.truncate(item.code, 120),
    item.label,
    item.score.toFixed(2),
    item.margin.toFixed(2),
    String(item.attempts),
    text.truncate(item.category, 80),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatProposalViews(items: CsatProposal[]): CsatProposalView[] {
  const views: CsatProposalView[] = [];
  for (const item of items) {
    views.push(toCsatProposalView(item));
  }
  return views;
}

export function sumCsatProposalView(view: CsatProposalView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedScore + parsedMargin + parsedAttempts;
}
