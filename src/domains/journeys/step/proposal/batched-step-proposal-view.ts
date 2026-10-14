import { BatchedStepProposal } from "./batched-step-proposal.js";

/** How screens and exports show a batched step proposal. */
export class BatchedStepProposalView {
  code: string;
  name: string;
  country: string;
  summary: string;
  frequencyCap: string;
  segment: string;
  graceDaysText: string;
  priorityText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    summary: string,
    frequencyCap: string,
    segment: string,
    graceDaysText: string,
    priorityText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.summary = summary;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.graceDaysText = graceDaysText;
    this.priorityText = priorityText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedStepProposalView(item: BatchedStepProposal): BatchedStepProposalView {
  return new BatchedStepProposalView(
    item.code,
    item.name,
    item.country,
    item.summary,
    String(item.frequencyCap),
    item.segment,
    String(item.graceDays),
    String(item.priority),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedStepProposalViews(items: BatchedStepProposal[]): BatchedStepProposalView[] {
  const views: BatchedStepProposalView[] = [];
  for (const item of items) {
    views.push(toBatchedStepProposalView(item));
  }
  return views;
}

export function sumBatchedStepProposalView(view: BatchedStepProposalView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedFrequencyCap + parsedGraceDays + parsedPriority;
}
