import { RegionalPostProposal } from "./regional-post-proposal.js";

/** How screens and exports show a regional post proposal. */
export class RegionalPostProposalView {
  code: string;
  label: string;
  weight: string;
  frequencyCap: string;
  updatedAt: string;
  windowDays: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    frequencyCap: string,
    updatedAt: string,
    windowDays: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPostProposalView(item: RegionalPostProposal): RegionalPostProposalView {
  return new RegionalPostProposalView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    String(item.frequencyCap),
    String(item.updatedAt),
    String(item.windowDays),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPostProposalViews(items: RegionalPostProposal[]): RegionalPostProposalView[] {
  const views: RegionalPostProposalView[] = [];
  for (const item of items) {
    views.push(toRegionalPostProposalView(item));
  }
  return views;
}

export function sumRegionalPostProposalView(view: RegionalPostProposalView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWeight + parsedFrequencyCap + parsedUpdatedAt;
}
