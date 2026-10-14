import * as text from "../../../../kit/text.js";
import { LenientFunnelProposal } from "./lenient-funnel-proposal.js";

/** How screens and exports show a lenient funnel proposal. */
export class LenientFunnelProposalView {
  codeText: string;
  label: string;
  approved: string;
  utmSourceText: string;
  channel: string;
  externalRef: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    approved: string,
    utmSourceText: string,
    channel: string,
    externalRef: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.approved = approved;
    this.utmSourceText = utmSourceText;
    this.channel = channel;
    this.externalRef = externalRef;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFunnelProposalView(item: LenientFunnelProposal): LenientFunnelProposalView {
  return new LenientFunnelProposalView(
    item.code,
    text.truncate(item.label, 40),
    `${item.approved}`,
    item.utmSource,
    item.channel,
    item.externalRef,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFunnelProposalViews(items: LenientFunnelProposal[]): LenientFunnelProposalView[] {
  const views: LenientFunnelProposalView[] = [];
  for (const item of items) {
    views.push(toLenientFunnelProposalView(item));
  }
  return views;
}

export function sumLenientFunnelProposalView(view: LenientFunnelProposalView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
