import { LenientNudgeProposal } from "./lenient-nudge-proposal.js";

/** How screens and exports show a lenient nudge proposal. */
export class LenientNudgeProposalView {
  code: string;
  name: string;
  budget: string;
  versionText: string;
  unit: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    versionText: string,
    unit: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.versionText = versionText;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toLenientNudgeProposalView(item: LenientNudgeProposal): LenientNudgeProposalView {
  return new LenientNudgeProposalView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    String(item.version),
    item.unit,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientNudgeProposalViews(items: LenientNudgeProposal[]): LenientNudgeProposalView[] {
  const views: LenientNudgeProposalView[] = [];
  for (const item of items) {
    views.push(toLenientNudgeProposalView(item));
  }
  return views;
}

export function sumLenientNudgeProposalView(view: LenientNudgeProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedBudget + parsedVersion;
}
