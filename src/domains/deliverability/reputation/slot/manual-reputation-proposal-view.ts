import { ManualReputationProposal } from "./manual-reputation-proposal.js";

/** How screens and exports show a manual reputation proposal. */
export class ManualReputationProposalView {
  codeText: string;
  name: string;
  openRateText: string;
  graceDaysText: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    openRateText: string,
    graceDaysText: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.openRateText = openRateText;
    this.graceDaysText = graceDaysText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toManualReputationProposalView(item: ManualReputationProposal): ManualReputationProposalView {
  return new ManualReputationProposalView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    String(item.graceDays),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualReputationProposalViews(items: ManualReputationProposal[]): ManualReputationProposalView[] {
  const views: ManualReputationProposalView[] = [];
  for (const item of items) {
    views.push(toManualReputationProposalView(item));
  }
  return views;
}

export function sumManualReputationProposalView(view: ManualReputationProposalView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedOpenRate + parsedGraceDays;
}
