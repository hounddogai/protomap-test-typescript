import { PreferenceProposal } from "./preference-proposal.js";

/** How screens and exports show a preference proposal. */
export class PreferenceProposalView {
  code: string;
  nameText: string;
  ratioText: string;
  discount: string;
  score: string;
  expiresAtText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ratioText: string,
    discount: string,
    score: string,
    expiresAtText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ratioText = ratioText;
    this.discount = discount;
    this.score = score;
    this.expiresAtText = expiresAtText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceProposalView(item: PreferenceProposal): PreferenceProposalView {
  return new PreferenceProposalView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    item.discount.toFixed(2),
    item.score.toFixed(2),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceProposalViews(items: PreferenceProposal[]): PreferenceProposalView[] {
  const views: PreferenceProposalView[] = [];
  for (const item of items) {
    views.push(toPreferenceProposalView(item));
  }
  return views;
}

export function sumPreferenceProposalView(view: PreferenceProposalView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedRatio + parsedDiscount + parsedScore;
}
