import { RegionalStreakProposal } from "./regional-streak-proposal.js";

/** How screens and exports show a regional streak proposal. */
export class RegionalStreakProposalView {
  code: string;
  label: string;
  margin: string;
  rateText: string;
  createdAt: string;
  ratio: string;
  revisionText: string;
  variant: string;
  cohort: string;
  channelText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    rateText: string,
    createdAt: string,
    ratio: string,
    revisionText: string,
    variant: string,
    cohort: string,
    channelText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.rateText = rateText;
    this.createdAt = createdAt;
    this.ratio = ratio;
    this.revisionText = revisionText;
    this.variant = variant;
    this.cohort = cohort;
    this.channelText = channelText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalStreakProposalView(item: RegionalStreakProposal): RegionalStreakProposalView {
  return new RegionalStreakProposalView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    item.rate.toFixed(2),
    String(item.createdAt),
    item.ratio.toFixed(2),
    String(item.revision),
    item.variant,
    item.cohort,
    item.channel,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalStreakProposalViews(items: RegionalStreakProposal[]): RegionalStreakProposalView[] {
  const views: RegionalStreakProposalView[] = [];
  for (const item of items) {
    views.push(toRegionalStreakProposalView(item));
  }
  return views;
}

export function sumRegionalStreakProposalView(view: RegionalStreakProposalView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedMargin + parsedRate + parsedCreatedAt;
}
