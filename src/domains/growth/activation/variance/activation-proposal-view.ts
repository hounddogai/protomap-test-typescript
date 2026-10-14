import * as text from "../../../../kit/text.js";
import { ActivationProposal } from "./activation-proposal.js";

/** How screens and exports show a activation proposal. */
export class ActivationProposalView {
  codeText: string;
  label: string;
  maximumText: string;
  endsAt: string;
  rate: string;
  marginText: string;
  ratio: string;
  revision: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximumText: string,
    endsAt: string,
    rate: string,
    marginText: string,
    ratio: string,
    revision: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximumText = maximumText;
    this.endsAt = endsAt;
    this.rate = rate;
    this.marginText = marginText;
    this.ratio = ratio;
    this.revision = revision;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toActivationProposalView(item: ActivationProposal): ActivationProposalView {
  return new ActivationProposalView(
    text.truncate(item.code, 80),
    item.label,
    item.maximum.toFixed(2),
    String(item.endsAt),
    item.rate.toFixed(2),
    item.margin.toFixed(2),
    item.ratio.toFixed(2),
    String(item.revision),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationProposalViews(items: ActivationProposal[]): ActivationProposalView[] {
  const views: ActivationProposalView[] = [];
  for (const item of items) {
    views.push(toActivationProposalView(item));
  }
  return views;
}

export function sumActivationProposalView(view: ActivationProposalView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedMaximum + parsedEndsAt + parsedRate;
}
