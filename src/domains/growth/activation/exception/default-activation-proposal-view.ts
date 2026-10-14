import { DefaultActivationProposal } from "./default-activation-proposal.js";

/** How screens and exports show a default activation proposal. */
export class DefaultActivationProposalView {
  codeText: string;
  title: string;
  archived: string;
  region: string;
  cohort: string;
  clicks: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    archived: string,
    region: string,
    cohort: string,
    clicks: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.archived = archived;
    this.region = region;
    this.cohort = cohort;
    this.clicks = clicks;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultActivationProposalView(item: DefaultActivationProposal): DefaultActivationProposalView {
  return new DefaultActivationProposalView(
    item.code,
    item.title,
    `${item.archived}`,
    item.region,
    item.cohort,
    String(item.clicks),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultActivationProposalViews(items: DefaultActivationProposal[]): DefaultActivationProposalView[] {
  const views: DefaultActivationProposalView[] = [];
  for (const item of items) {
    views.push(toDefaultActivationProposalView(item));
  }
  return views;
}

export function sumDefaultActivationProposalView(view: DefaultActivationProposalView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedClicks + parsedRatio;
}
